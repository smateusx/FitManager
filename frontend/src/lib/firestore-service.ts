import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'

export type Perfil = {
  id: string
  role: 'ADMIN' | 'RECEPCIONISTA' | 'ALUNO' | null
  academia_id: string | null
  nome_completo: string | null
  telefone?: string | null
  avatar_url?: string | null
  created_at?: string
}

export type Exercicio = {
  id: string
  nome: string
  series: number
  repeticoes: string
  carga: string
  descanso: string
  ordem: number
  ficha_id: string
}

export type Ficha = {
  id: string
  nome: string
  objetivo: string | null
  aluno_id: string
  academia_id: string | null
  criado_em: string
}

export type Plano = {
  id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_dias: number
  ativo: boolean
  academia_id: string | null
}

export type Matricula = {
  id: string
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO'
  data_inicio: string
  data_vencimento: string
  valor_pago: number | null
  aluno_id: string
  plano_id: string | null
  academia_id: string | null
  criado_em: string
  observacoes?: string | null
}

export type VencimentoProximo = {
  matricula_id: string
  aluno_nome: string
  aluno_telefone: string
  plano_nome: string
  data_vencimento: string
  status_vencimento: 'VENCIDO' | 'VENCENDO_EM_BREVE' | 'EM_DIA'
  dias_para_vencimento: number
}

export type MatriculaWithDetails = Matricula & {
  perfis?: { nome_completo: string | null }
  planos?: { nome: string; valor: number } | null
}

function toIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as { toDate: () => Date }
    return candidate.toDate().toISOString()
  }
  return new Date(value as string).toISOString()
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sortByIsoDateDesc<T>(items: T[], getter: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) => new Date(getter(b)).getTime() - new Date(getter(a)).getTime()
  )
}

async function mapPerfisById(ids: string[]): Promise<Record<string, Perfil>> {
  const db = getFirebaseDb()
  const uniqueIds = [...new Set(ids)].filter(Boolean)
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const snap = await getDoc(doc(db, 'perfis', id))
      if (!snap.exists()) return [id, null] as const
      const data = snap.data()
      return [
        id,
        {
          id: snap.id,
          role: (data.role as Perfil['role']) ?? null,
          academia_id: (data.academia_id as string | null) ?? null,
          nome_completo: (data.nome_completo as string | null) ?? null,
          telefone: (data.telefone as string | null) ?? null,
          avatar_url: (data.avatar_url as string | null) ?? null,
          created_at: toIsoDate(data.created_at),
        } satisfies Perfil,
      ] as const
    })
  )

  return entries.reduce<Record<string, Perfil>>((acc, [id, perfil]) => {
    if (perfil) acc[id] = perfil
    return acc
  }, {})
}

async function mapPlanosById(ids: string[]): Promise<Record<string, Plano>> {
  const db = getFirebaseDb()
  const uniqueIds = [...new Set(ids)].filter(Boolean)
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const snap = await getDoc(doc(db, 'planos', id))
      if (!snap.exists()) return [id, null] as const
      const data = snap.data()
      return [
        id,
        {
          id: snap.id,
          nome: (data.nome as string) ?? 'Plano',
          descricao: (data.descricao as string | null) ?? null,
          valor: asNumber(data.valor),
          duracao_dias: asNumber(data.duracao_dias, 30),
          ativo: data.ativo !== false,
          academia_id: (data.academia_id as string | null) ?? null,
        } satisfies Plano,
      ] as const
    })
  )

  return entries.reduce<Record<string, Plano>>((acc, [id, plano]) => {
    if (plano) acc[id] = plano
    return acc
  }, {})
}

export async function getPerfilById(userId: string): Promise<Perfil | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'perfis', userId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    role: (data.role as Perfil['role']) ?? null,
    academia_id: (data.academia_id as string | null) ?? null,
    nome_completo: (data.nome_completo as string | null) ?? null,
    telefone: (data.telefone as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    created_at: toIsoDate(data.created_at),
  }
}

export async function updatePerfil(
  userId: string,
  updates: Partial<Omit<Perfil, 'id'>>
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'perfis', userId), updates)
}

export async function listAlunosByAcademia(
  academiaId: string
): Promise<Perfil[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'perfis'),
    where('academia_id', '==', academiaId),
    where('role', '==', 'ALUNO')
  )
  const snap = await getDocs(q)
  return sortByIsoDateDesc(
    snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        role: 'ALUNO',
        academia_id: academiaId,
        nome_completo: (data.nome_completo as string | null) ?? null,
        telefone: (data.telefone as string | null) ?? null,
        avatar_url: (data.avatar_url as string | null) ?? null,
        created_at: toIsoDate(data.created_at),
      } satisfies Perfil
    }),
    (aluno) => aluno.created_at ?? ''
  )
}

export async function listPlanosByAcademia(
  academiaId: string,
  onlyActive = false
): Promise<Plano[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'planos'), where('academia_id', '==', academiaId))
  const snap = await getDocs(q)
  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        nome: (data.nome as string) ?? '',
        descricao: (data.descricao as string | null) ?? null,
        valor: asNumber(data.valor),
        duracao_dias: asNumber(data.duracao_dias, 30),
        ativo: data.ativo !== false,
        academia_id: academiaId,
      } satisfies Plano
    })
    .filter((plano) => (onlyActive ? plano.ativo : true))
    .sort((a, b) => a.valor - b.valor)
}

export async function createPlano(input: {
  academia_id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_dias: number
}): Promise<string> {
  const db = getFirebaseDb()
  const ref = await addDoc(collection(db, 'planos'), {
    ...input,
    ativo: true,
    created_at: new Date().toISOString(),
  })
  return ref.id
}

export async function listMatriculasByAcademia(
  academiaId: string
): Promise<Matricula[]> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'matriculas'),
    where('academia_id', '==', academiaId)
  )
  const snap = await getDocs(q)
  return sortByIsoDateDesc(
    snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        status: ((data.status as Matricula['status']) ?? 'ATIVO'),
        data_inicio: toIsoDate(data.data_inicio).split('T')[0],
        data_vencimento: toIsoDate(data.data_vencimento).split('T')[0],
        valor_pago:
          data.valor_pago === null || data.valor_pago === undefined
            ? null
            : asNumber(data.valor_pago),
        aluno_id: (data.aluno_id as string) ?? '',
        plano_id: (data.plano_id as string | null) ?? null,
        academia_id: (data.academia_id as string | null) ?? academiaId,
        criado_em: toIsoDate(data.criado_em ?? data.created_at ?? data.data_inicio),
        observacoes: (data.observacoes as string | null) ?? null,
      } satisfies Matricula
    }),
    (m) => m.data_vencimento
  )
}

export async function listMatriculasByAluno(
  alunoId: string
): Promise<Matricula[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'matriculas'), where('aluno_id', '==', alunoId))
  const snap = await getDocs(q)
  return sortByIsoDateDesc(
    snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        status: ((data.status as Matricula['status']) ?? 'ATIVO'),
        data_inicio: toIsoDate(data.data_inicio).split('T')[0],
        data_vencimento: toIsoDate(data.data_vencimento).split('T')[0],
        valor_pago:
          data.valor_pago === null || data.valor_pago === undefined
            ? null
            : asNumber(data.valor_pago),
        aluno_id: (data.aluno_id as string) ?? alunoId,
        plano_id: (data.plano_id as string | null) ?? null,
        academia_id: (data.academia_id as string | null) ?? null,
        criado_em: toIsoDate(data.criado_em ?? data.created_at ?? data.data_inicio),
        observacoes: (data.observacoes as string | null) ?? null,
      } satisfies Matricula
    }),
    (m) => m.data_vencimento
  )
}

export async function listMatriculasByAcademiaWithDetails(
  academiaId: string
): Promise<MatriculaWithDetails[]> {
  const matriculas = await listMatriculasByAcademia(academiaId)
  const perfisMap = await mapPerfisById(matriculas.map((m) => m.aluno_id))
  const planosMap = await mapPlanosById(
    matriculas.map((m) => m.plano_id).filter(Boolean) as string[]
  )

  return matriculas.map((matricula) => ({
    ...matricula,
    perfis: {
      nome_completo: perfisMap[matricula.aluno_id]?.nome_completo ?? null,
    },
    planos: matricula.plano_id
      ? {
          nome: planosMap[matricula.plano_id]?.nome ?? 'Plano Personalizado',
          valor: planosMap[matricula.plano_id]?.valor ?? 0,
        }
      : null,
  }))
}

export async function listMatriculasByAlunoWithDetails(
  alunoId: string
): Promise<MatriculaWithDetails[]> {
  const matriculas = await listMatriculasByAluno(alunoId)
  const planosMap = await mapPlanosById(
    matriculas.map((m) => m.plano_id).filter(Boolean) as string[]
  )
  return matriculas.map((matricula) => ({
    ...matricula,
    planos: matricula.plano_id
      ? {
          nome: planosMap[matricula.plano_id]?.nome ?? 'Plano Personalizado',
          valor: planosMap[matricula.plano_id]?.valor ?? 0,
        }
      : null,
  }))
}

export async function createMatricula(input: {
  academia_id: string
  aluno_id: string
  plano_id: string | null
  data_inicio: string
  data_vencimento: string
  valor_pago: number | null
  status: Matricula['status']
  observacoes?: string | null
}): Promise<string> {
  const db = getFirebaseDb()
  const ref = await addDoc(collection(db, 'matriculas'), {
    ...input,
    criado_em: new Date().toISOString(),
  })
  return ref.id
}

export async function updateMatriculaStatus(
  matriculaId: string,
  status: Matricula['status']
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'matriculas', matriculaId), { status })
}

export async function listFichasByAluno(
  alunoId: string
): Promise<Array<Ficha & { exercicios: Exercicio[] }>> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'fichas_treino'), where('aluno_id', '==', alunoId))
  const snap = await getDocs(q)
  const fichas = sortByIsoDateDesc(
    snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        nome: (data.nome as string) ?? '',
        objetivo: (data.objetivo as string | null) ?? null,
        aluno_id: (data.aluno_id as string) ?? alunoId,
        academia_id: (data.academia_id as string | null) ?? null,
        criado_em: toIsoDate(data.criado_em ?? data.created_at),
      } satisfies Ficha
    }),
    (ficha) => ficha.criado_em
  )

  const exercicios = await listExerciciosByFichaIds(fichas.map((f) => f.id))
  return fichas.map((ficha) => ({
    ...ficha,
    exercicios: exercicios[ficha.id] ?? [],
  }))
}

async function listExerciciosByFichaIds(
  fichaIds: string[]
): Promise<Record<string, Exercicio[]>> {
  const db = getFirebaseDb()
  const snap = await getDocs(collection(db, 'exercicios'))
  const byFicha = snap.docs.reduce<Record<string, Exercicio[]>>((acc, docSnap) => {
    const data = docSnap.data()
    const fichaId = (data.ficha_id as string) ?? ''
    if (!fichaIds.includes(fichaId)) return acc
    if (!acc[fichaId]) acc[fichaId] = []
    acc[fichaId].push({
      id: docSnap.id,
      nome: (data.nome as string) ?? '',
      series: asNumber(data.series, 0),
      repeticoes: (data.repeticoes as string) ?? '',
      carga: (data.carga as string) ?? '',
      descanso: (data.descanso as string) ?? '',
      ordem: asNumber(data.ordem, 0),
      ficha_id: fichaId,
    })
    return acc
  }, {})

  Object.keys(byFicha).forEach((fichaId) => {
    byFicha[fichaId] = byFicha[fichaId].sort((a, b) => a.ordem - b.ordem)
  })
  return byFicha
}

export async function listFichasByAcademiaWithDetails(
  academiaId: string
): Promise<Array<Ficha & { perfis?: { nome_completo: string | null }; exercicios: Exercicio[] }>> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'fichas_treino'),
    where('academia_id', '==', academiaId)
  )
  const snap = await getDocs(q)
  const fichas = sortByIsoDateDesc(
    snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        nome: (data.nome as string) ?? '',
        objetivo: (data.objetivo as string | null) ?? null,
        aluno_id: (data.aluno_id as string) ?? '',
        academia_id: academiaId,
        criado_em: toIsoDate(data.criado_em ?? data.created_at),
      } satisfies Ficha
    }),
    (ficha) => ficha.criado_em
  )
  const perfisMap = await mapPerfisById(fichas.map((f) => f.aluno_id))
  const exercicios = await listExerciciosByFichaIds(fichas.map((f) => f.id))

  return fichas.map((ficha) => ({
    ...ficha,
    perfis: {
      nome_completo: perfisMap[ficha.aluno_id]?.nome_completo ?? null,
    },
    exercicios: exercicios[ficha.id] ?? [],
  }))
}

export async function createFichaWithExercises(input: {
  academia_id: string
  aluno_id: string
  nome: string
  objetivo: string | null
  exercicios: Array<Omit<Exercicio, 'id' | 'ficha_id' | 'ordem'> & { ordem: number }>
}): Promise<string> {
  const db = getFirebaseDb()
  const fichaRef = await addDoc(collection(db, 'fichas_treino'), {
    nome: input.nome,
    objetivo: input.objetivo,
    academia_id: input.academia_id,
    aluno_id: input.aluno_id,
    criado_em: new Date().toISOString(),
  })

  await Promise.all(
    input.exercicios.map((exercicio) =>
      addDoc(collection(db, 'exercicios'), {
        ...exercicio,
        ficha_id: fichaRef.id,
      })
    )
  )

  return fichaRef.id
}

export async function deleteFichaCascade(fichaId: string): Promise<void> {
  const db = getFirebaseDb()
  const exerciciosSnap = await getDocs(
    query(collection(db, 'exercicios'), where('ficha_id', '==', fichaId))
  )
  await Promise.all(exerciciosSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)))
  await deleteDoc(doc(db, 'fichas_treino', fichaId))
}

export async function addRegistroCarga(input: {
  aluno_id: string
  exercicio_id: string
  carga: string
  repeticoes: number
  data_registro?: string
}): Promise<void> {
  const db = getFirebaseDb()
  await addDoc(collection(db, 'registros_carga'), {
    ...input,
    data_registro: input.data_registro ?? new Date().toISOString(),
  })
}

export async function listRegistrosCarga(
  alunoId: string,
  exercicioId: string
): Promise<Array<{ data_registro: string; carga: number; repeticoes: number }>> {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, 'registros_carga'), where('aluno_id', '==', alunoId))
  )

  return snap.docs
    .map((docSnap) => docSnap.data())
    .filter((row) => (row.exercicio_id as string) === exercicioId)
    .map((row) => ({
      data_registro: toIsoDate(row.data_registro),
      carga: asNumber(row.carga),
      repeticoes: asNumber(row.repeticoes),
    }))
    .sort(
      (a, b) =>
        new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime()
    )
}

export async function listRevenueLastMonths(academiaId: string): Promise<
  Array<{ name: string; total: number }>
> {
  const matriculas = await listMatriculasByAcademia(academiaId)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const grouped: Record<string, number> = {}

  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`
    grouped[key] = 0
  }

  matriculas.forEach((m) => {
    if (m.valor_pago === null) return
    const date = new Date(`${m.data_inicio}T12:00:00`)
    const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`
    if (grouped[key] !== undefined) grouped[key] += Number(m.valor_pago)
  })

  return Object.entries(grouped)
    .map(([name, total]) => ({ name, total }))
    .reverse()
}

export async function getDashboardSnapshot(academiaId: string): Promise<{
  totalAlunos: number
  totalTreinos: number
  receitaMensal: number
  vencimentosMes: number
  recentActivities: Array<{
    id: string
    aluno_nome: string
    plano_nome: string
    valor: number
    data: string
  }>
}> {
  const [alunos, fichas, matriculas] = await Promise.all([
    listAlunosByAcademia(academiaId),
    listFichasByAcademiaWithDetails(academiaId),
    listMatriculasByAcademiaWithDetails(academiaId),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const matriculasMes = matriculas.filter(
    (m) => new Date(m.criado_em).getTime() >= startOfMonth
  )

  const receitaMensal = matriculasMes
    .filter((m) => m.status === 'ATIVO' && m.valor_pago)
    .reduce((sum, m) => sum + Number(m.valor_pago), 0)

  const vencimentosMes = matriculasMes.filter((m) => m.status === 'VENCIDO').length
  const recentActivities = sortByIsoDateDesc(matriculas, (m) => m.criado_em)
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      aluno_nome: m.perfis?.nome_completo || 'Aluno Desconhecido',
      plano_nome: m.planos?.nome || 'Plano Personalizado',
      valor: Number(m.valor_pago || 0),
      data: m.criado_em,
    }))

  return {
    totalAlunos: alunos.length,
    totalTreinos: fichas.length,
    receitaMensal,
    vencimentosMes,
    recentActivities,
  }
}

export async function listVencimentosProximos(
  academiaId: string
): Promise<VencimentoProximo[]> {
  const matriculas = await listMatriculasByAcademiaWithDetails(academiaId)
  const perfisMap = await mapPerfisById(matriculas.map((m) => m.aluno_id))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results = matriculas
    .map((matricula) => {
      const vencimento = new Date(`${matricula.data_vencimento}T12:00:00`)
      const diffMs = vencimento.getTime() - today.getTime()
      const diasParaVencimento = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      const status_vencimento: VencimentoProximo['status_vencimento'] =
        matricula.status === 'VENCIDO' || diasParaVencimento < 0
          ? 'VENCIDO'
          : diasParaVencimento <= 7
            ? 'VENCENDO_EM_BREVE'
            : 'EM_DIA'

      return {
        matricula_id: matricula.id,
        aluno_nome:
          perfisMap[matricula.aluno_id]?.nome_completo || 'Aluno sem nome',
        aluno_telefone: perfisMap[matricula.aluno_id]?.telefone || '',
        plano_nome: matricula.planos?.nome || 'Plano',
        data_vencimento: matricula.data_vencimento,
        status_vencimento,
        dias_para_vencimento: diasParaVencimento,
      } satisfies VencimentoProximo
    })
    .filter((row) => row.status_vencimento !== 'EM_DIA')
    .sort(
      (a, b) =>
        new Date(`${a.data_vencimento}T12:00:00`).getTime() -
        new Date(`${b.data_vencimento}T12:00:00`).getTime()
    )

  return results
}

export async function deleteAlunoCascade(alunoId: string): Promise<void> {
  const db = getFirebaseDb()

  const [matriculasSnap, fichasSnap, registrosSnap] = await Promise.all([
    getDocs(query(collection(db, 'matriculas'), where('aluno_id', '==', alunoId))),
    getDocs(query(collection(db, 'fichas_treino'), where('aluno_id', '==', alunoId))),
    getDocs(query(collection(db, 'registros_carga'), where('aluno_id', '==', alunoId))),
  ])

  await Promise.all(matriculasSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)))
  await Promise.all(registrosSnap.docs.map((docSnap) => deleteDoc(docSnap.ref)))

  for (const fichaDoc of fichasSnap.docs) {
    await deleteFichaCascade(fichaDoc.id)
  }

  await deleteDoc(doc(db, 'perfis', alunoId))
}

export async function ensurePerfil(
  userId: string,
  payload: Omit<Perfil, 'id'>
): Promise<void> {
  const db = getFirebaseDb()
  await setDoc(
    doc(db, 'perfis', userId),
    {
      ...payload,
      created_at: payload.created_at ?? new Date().toISOString(),
    },
    { merge: true }
  )
}
