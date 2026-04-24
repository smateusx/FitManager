import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'

type SupabaseError = { message: string }
type QueryFilter =
  | { type: 'eq'; field: string; value: unknown }
  | { type: 'gte'; field: string; value: unknown }
  | { type: 'not'; field: string; operator: string; value: unknown }

type SupabaseUser = {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
}

type Session = {
  user: SupabaseUser
}

function nowIso() {
  return new Date().toISOString()
}

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

function normalizeError(error: unknown): SupabaseError {
  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: 'Erro inesperado ao processar operação.' }
}

function mapUser(user: FirebaseUser): SupabaseUser {
  return {
    id: user.uid,
    email: user.email,
    user_metadata: {},
  }
}

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
    const next = entries.reduce<Record<string, unknown>>((acc, [key, v]) => {
      acc[key] = sanitizeForFirestore(v)
      return acc
    }, {})
    return next as T
  }

  return value
}

async function resolveAuthUser(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

async function loadCollection(table: string): Promise<Record<string, unknown>[]> {
  if (table === 'vencimentos_proximos') {
    return buildVencimentosView()
  }

  const snapshot = await getDocs(collection(db, table))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

async function loadProfile(userId: string): Promise<Record<string, unknown> | null> {
  const snapshot = await getDoc(doc(db, 'perfis', userId))
  if (!snapshot.exists()) {
    return null
  }

  return { id: snapshot.id, ...snapshot.data() }
}

async function ensureProfileForUser(
  user: FirebaseUser,
  metadata?: Record<string, unknown>
): Promise<void> {
  const existing = await loadProfile(user.uid)
  if (existing) {
    return
  }

  const academiaId =
    typeof metadata?.academia_id === 'string' && metadata.academia_id.length > 0
      ? metadata.academia_id
      : null
  const nomeCompleto =
    typeof metadata?.nome_completo === 'string' ? metadata.nome_completo : null

  await setDoc(doc(db, 'perfis', user.uid), {
    id: user.uid,
    nome_completo: nomeCompleto,
    telefone: null,
    avatar_url: null,
    role: 'ALUNO',
    academia_id: academiaId,
    created_at: nowIso(),
    email: user.email ?? null,
  })
}

async function getCurrentAcademiaId(): Promise<string | null> {
  const user = await resolveAuthUser()
  if (!user) return null

  const profile = await loadProfile(user.uid)
  const academiaId = profile?.academia_id
  return typeof academiaId === 'string' ? academiaId : null
}

async function scopeRowsByAcademia(
  table: string,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const user = await resolveAuthUser()
  if (!user) {
    return rows
  }

  const profile = await loadProfile(user.uid)
  const role = profile?.role
  const academiaId =
    typeof profile?.academia_id === 'string' ? profile.academia_id : null

  if (table === 'perfis') {
    if (!academiaId) return rows.filter((row) => row.id === user.uid)
    return rows.filter(
      (row) =>
        row.id === user.uid ||
        (typeof row.academia_id === 'string' && row.academia_id === academiaId)
    )
  }

  if (table === 'academias') {
    if (!academiaId) return rows
    return rows.filter((row) => row.id === academiaId)
  }

  if (table === 'exercicios') {
    const fichasRows = await loadCollection('fichas_treino')
    const scopedFichas = await scopeRowsByAcademia('fichas_treino', fichasRows)
    const fichaIds = new Set(scopedFichas.map((ficha) => String(ficha.id)))
    return rows.filter((row) => fichaIds.has(String(row.ficha_id ?? '')))
  }

  if (table === 'evolucao_carga') {
    if (role === 'ALUNO') {
      return rows.filter((row) => row.aluno_id === user.uid)
    }

    if (!academiaId) return rows
    const perfis = await loadCollection('perfis')
    const allowedAlunoIds = new Set(
      perfis
        .filter((item) => item.academia_id === academiaId)
        .map((item) => String(item.id))
    )
    return rows.filter((row) => allowedAlunoIds.has(String(row.aluno_id ?? '')))
  }

  if (!academiaId) {
    return rows
  }

  if (role === 'ALUNO' && table === 'fichas_treino') {
    return rows.filter((row) => row.aluno_id === user.uid)
  }

  return rows.filter((row) => row.academia_id === academiaId)
}

function applyFilters(
  rows: Record<string, unknown>[],
  filters: QueryFilter[]
): Record<string, unknown>[] {
  return rows.filter((row) =>
    filters.every((filter) => {
      const value = row[filter.field]
      if (filter.type === 'eq') {
        return value === filter.value
      }

      if (filter.type === 'gte') {
        if (value === undefined || value === null) return false
        return String(value) >= String(filter.value)
      }

      if (filter.type === 'not') {
        if (filter.operator === 'is' && filter.value === null) {
          return value !== null && value !== undefined
        }
      }

      return true
    })
  )
}

function applyOrdering(
  rows: Record<string, unknown>[],
  orderByField: string | null,
  ascending: boolean
): Record<string, unknown>[] {
  if (!orderByField) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const aValue = a[orderByField]
    const bValue = b[orderByField]

    if (aValue === bValue) return 0
    if (aValue === undefined || aValue === null) return ascending ? -1 : 1
    if (bValue === undefined || bValue === null) return ascending ? 1 : -1

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return ascending ? aValue - bValue : bValue - aValue
    }

    const compare = String(aValue).localeCompare(String(bValue))
    return ascending ? compare : -compare
  })
}

async function attachRelations(
  table: string,
  rows: Record<string, unknown>[],
  selectClause: string
): Promise<Record<string, unknown>[]> {
  const withExercises = table === 'fichas_treino' && selectClause.includes('exercicios(')
  const withPerfilOnFicha = table === 'fichas_treino' && selectClause.includes('perfis(')
  const withPerfilOnMatricula = table === 'matriculas' && selectClause.includes('perfis(')
  const withPlanoOnMatricula = table === 'matriculas' && selectClause.includes('planos(')

  if (!withExercises && !withPerfilOnFicha && !withPerfilOnMatricula && !withPlanoOnMatricula) {
    return rows
  }

  const exercicios = withExercises ? await loadCollection('exercicios') : []
  const perfis = withPerfilOnFicha || withPerfilOnMatricula ? await loadCollection('perfis') : []
  const planos = withPlanoOnMatricula ? await loadCollection('planos') : []

  return rows.map((row) => {
    const next = { ...row }

    if (withExercises) {
      next.exercicios = exercicios
        .filter((item) => item.ficha_id === row.id)
        .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
    }

    if (withPerfilOnFicha) {
      next.perfis = perfis.find((item) => item.id === row.aluno_id) ?? null
    }

    if (withPerfilOnMatricula) {
      next.perfis = perfis.find((item) => item.id === row.aluno_id) ?? null
    }

    if (withPlanoOnMatricula) {
      next.planos = planos.find((item) => item.id === row.plano_id) ?? null
    }

    if (table === 'matriculas' && !next.criado_em) {
      next.criado_em = next.data_inicio ?? next.created_at ?? nowIso()
    }

    return next
  })
}

async function buildVencimentosView(): Promise<Record<string, unknown>[]> {
  const matriculas = await scopeRowsByAcademia('matriculas', await loadCollection('matriculas'))
  const perfis = await loadCollection('perfis')
  const planos = await loadCollection('planos')
  const today = new Date(todayIsoDate())

  return matriculas
    .filter((item) => item.status !== 'CANCELADO')
    .map((item) => {
      const perfil = perfis.find((perfilItem) => perfilItem.id === item.aluno_id)
      const plano = planos.find((planoItem) => planoItem.id === item.plano_id)
      const dueDate = new Date(String(item.data_vencimento ?? todayIsoDate()))
      const diffInDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000)
      const statusVencimento = diffInDays < 0 ? 'VENCIDO' : 'VENCENDO_EM_BREVE'

      return {
        matricula_id: item.id,
        aluno_nome: perfil?.nome_completo ?? 'Aluno',
        aluno_telefone: perfil?.telefone ?? '',
        plano_nome: plano?.nome ?? 'Plano',
        data_vencimento: item.data_vencimento ?? todayIsoDate(),
        status_vencimento: statusVencimento,
        dias_para_vencimento: diffInDays,
      }
    })
    .filter((item) => Number(item.dias_para_vencimento) <= 7)
    .sort((a, b) => Number(a.dias_para_vencimento) - Number(b.dias_para_vencimento))
}

async function deleteWithPredicate(
  table: string,
  predicate: (row: Record<string, unknown>) => boolean
) {
  const rows = await loadCollection(table)
  await Promise.all(
    rows.filter(predicate).map((row) => deleteDoc(doc(db, table, String(row.id))))
  )
}

class FirebaseSupabaseQuery {
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private filters: QueryFilter[] = []
  private orderField: string | null = null
  private ascending = true
  private limitValue: number | null = null
  private singleMode = false
  private selectClause = '*'
  private countRequested: string | null = null
  private headRequested = false
  private payload: unknown = null

  constructor(private readonly table: string) {}

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectClause = columns
    this.countRequested = options?.count ?? null
    this.headRequested = Boolean(options?.head)
    return this
  }

  insert(payload: unknown) {
    this.action = 'insert'
    this.payload = payload
    return this
  }

  update(payload: unknown) {
    this.action = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ type: 'eq', field, value })
    return this
  }

  gte(field: string, value: unknown) {
    this.filters.push({ type: 'gte', field, value })
    return this
  }

  not(field: string, operator: string, value: unknown) {
    this.filters.push({ type: 'not', field, operator, value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field
    this.ascending = options?.ascending ?? true
    return this
  }

  limit(limitValue: number) {
    this.limitValue = limitValue
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) {
    return this.execute().catch(onrejected)
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally)
  }

  private async execute(): Promise<any> {
    try {
      if (this.action === 'insert') {
        return this.executeInsert()
      }
      if (this.action === 'update') {
        return this.executeUpdate()
      }
      if (this.action === 'delete') {
        return this.executeDelete()
      }
      return this.executeSelect()
    } catch (error) {
      return { data: null, error: normalizeError(error), count: null }
    }
  }

  private async executeSelect() {
    const baseRows = await loadCollection(this.table)
    const scopedRows = await scopeRowsByAcademia(this.table, baseRows)
    const filteredRows = applyFilters(scopedRows, this.filters)
    const sortedRows = applyOrdering(filteredRows, this.orderField, this.ascending)
    const limitedRows =
      this.limitValue !== null ? sortedRows.slice(0, this.limitValue) : sortedRows
    const hydratedRows = await attachRelations(this.table, limitedRows, this.selectClause)
    const count = this.countRequested === 'exact' ? hydratedRows.length : null

    if (this.headRequested) {
      return { data: null, error: null, count }
    }

    if (this.singleMode) {
      return { data: hydratedRows[0] ?? null, error: null, count }
    }

    return { data: hydratedRows, error: null, count }
  }

  private async executeInsert() {
    const payloadList = Array.isArray(this.payload) ? this.payload : [this.payload]
    const inserted: Record<string, unknown>[] = []

    for (const rawItem of payloadList) {
      const item = sanitizeForFirestore(rawItem ?? {}) as Record<string, unknown>
      const withDefaults = { ...item } as Record<string, unknown>

      if (this.table === 'planos' && withDefaults.ativo === undefined) {
        withDefaults.ativo = true
      }
      if (this.table === 'perfis' && withDefaults.created_at === undefined) {
        withDefaults.created_at = nowIso()
      }
      if (this.table === 'fichas_treino' && withDefaults.criado_em === undefined) {
        withDefaults.criado_em = nowIso()
      }
      if (this.table === 'matriculas') {
        if (withDefaults.criado_em === undefined) withDefaults.criado_em = nowIso()
        if (withDefaults.created_at === undefined) withDefaults.created_at = nowIso()
      }
      if (this.table === 'academias' && withDefaults.created_at === undefined) {
        withDefaults.created_at = nowIso()
      }
      if (this.table === 'evolucao_carga' && withDefaults.registrado_em === undefined) {
        withDefaults.registrado_em = todayIsoDate()
      }

      const explicitId =
        typeof withDefaults.id === 'string' && withDefaults.id.length > 0
          ? withDefaults.id
          : null

      if (explicitId) {
        await setDoc(doc(db, this.table, explicitId), withDefaults, { merge: true })
        inserted.push({ id: explicitId, ...withDefaults })
      } else {
        const reference = await addDoc(collection(db, this.table), withDefaults)
        inserted.push({ id: reference.id, ...withDefaults })
      }
    }

    const data = this.singleMode ? inserted[0] ?? null : inserted
    return { data, error: null, count: null }
  }

  private async executeUpdate() {
    const baseRows = await loadCollection(this.table)
    const scopedRows = await scopeRowsByAcademia(this.table, baseRows)
    const filteredRows = applyFilters(scopedRows, this.filters)
    const payload = sanitizeForFirestore((this.payload ?? {}) as Record<string, unknown>)

    await Promise.all(
      filteredRows.map((row) => updateDoc(doc(db, this.table, String(row.id)), payload))
    )

    const updatedRows = filteredRows.map((row) => ({ ...row, ...payload }))
    const data = this.singleMode ? updatedRows[0] ?? null : updatedRows
    return { data, error: null, count: null }
  }

  private async executeDelete() {
    const baseRows = await loadCollection(this.table)
    const scopedRows = await scopeRowsByAcademia(this.table, baseRows)
    const filteredRows = applyFilters(scopedRows, this.filters)

    await Promise.all(
      filteredRows.map((row) => deleteDoc(doc(db, this.table, String(row.id))))
    )

    if (this.table === 'fichas_treino') {
      const deletedFichaIds = new Set(filteredRows.map((row) => String(row.id)))
      await deleteWithPredicate('exercicios', (row) => deletedFichaIds.has(String(row.ficha_id)))
    }

    if (this.table === 'perfis') {
      const deletedAlunoIds = new Set(filteredRows.map((row) => String(row.id)))
      await deleteWithPredicate('fichas_treino', (row) =>
        deletedAlunoIds.has(String(row.aluno_id))
      )
      await deleteWithPredicate('matriculas', (row) =>
        deletedAlunoIds.has(String(row.aluno_id))
      )
      await deleteWithPredicate('evolucao_carga', (row) =>
        deletedAlunoIds.has(String(row.aluno_id))
      )
    }

    const data = this.singleMode ? filteredRows[0] ?? null : filteredRows
    return { data, error: null, count: null }
  }
}

export const supabase: any = {
  auth: {
    async getSession() {
      try {
        const user = await resolveAuthUser()
        const session: Session | null = user ? { user: mapUser(user) } : null
        return { data: { session }, error: null }
      } catch (error) {
        return { data: { session: null }, error: normalizeError(error) }
      }
    },
    onAuthStateChange(callback: (event: string, session: Session | null) => void | Promise<void>) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        const event = user ? 'SIGNED_IN' : 'SIGNED_OUT'
        const session = user ? { user: mapUser(user) } : null
        await callback(event, session)
      })

      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
        error: null,
      }
    },
    async signInWithPassword({
      email,
      password,
    }: {
      email: string
      password: string
    }) {
      try {
        const credentials = await signInWithEmailAndPassword(auth, email, password)
        await ensureProfileForUser(credentials.user)
        return { data: { user: mapUser(credentials.user) }, error: null }
      } catch (error) {
        return { data: { user: null }, error: normalizeError(error) }
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }) {
      try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password)
        await ensureProfileForUser(credentials.user, options?.data)
        return { data: { user: mapUser(credentials.user) }, error: null }
      } catch (error) {
        return { data: { user: null }, error: normalizeError(error) }
      }
    },
    async signOut() {
      try {
        await firebaseSignOut(auth)
        return { error: null }
      } catch (error) {
        return { error: normalizeError(error) }
      }
    },
    async updateUser({ password }: { password: string }) {
      try {
        const user = await resolveAuthUser()
        if (!user) {
          return { data: null, error: { message: 'Usuário não autenticado.' } }
        }

        await updatePassword(user, password)
        return { data: { user: mapUser(user) }, error: null }
      } catch (error) {
        return { data: null, error: normalizeError(error) }
      }
    },
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: Blob) {
          try {
            await uploadBytes(ref(storage, `${bucket}/${filePath}`), file)
            return { data: { path: filePath }, error: null }
          } catch (error) {
            return { data: null, error: normalizeError(error) }
          }
        },
        getPublicUrl(filePath: string) {
          const bucketName = storage.app.options.storageBucket
          const encodedPath = encodeURIComponent(`${bucket}/${filePath}`)
          return {
            data: {
              publicUrl: `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`,
            },
          }
        },
      }
    },
  },
  async getCurrentAcademiaId() {
    return getCurrentAcademiaId()
  },
  from(table: string) {
    return new FirebaseSupabaseQuery(table)
  },
}
