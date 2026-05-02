import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export type Role = 'ADMIN' | 'RECEPCIONISTA' | 'ALUNO'

/** Aceita variações vindas do Firestore (ex.: "Aluno") e valores desconhecidos. */
export function normalizeRole(raw: unknown): Role | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '_')
  if (s === 'ADMIN' || s === 'RECEPCIONISTA' || s === 'ALUNO') return s
  return null
}

function tsToIso(v: unknown): string {
  if (v && typeof (v as Timestamp).toDate === 'function') {
    return (v as Timestamp).toDate().toISOString()
  }
  if (typeof v === 'string') return v
  return new Date().toISOString()
}

export class CpfAlreadyRegisteredError extends Error {
  constructor(message = 'Este CPF já está cadastrado em outra conta.') {
    super(message)
    this.name = 'CpfAlreadyRegisteredError'
  }
}

export async function getPerfil(userId: string) {
  const snap = await getDoc(doc(getDb(), 'perfis', userId))
  if (!snap.exists()) return null
  const d = snap.data()!
  return {
    id: snap.id,
    role: normalizeRole(d.role),
    academia_id: d.academia_id ?? null,
    nome_completo: d.nome_completo ?? null,
    telefone: d.telefone ?? null,
    cpf: (d.cpf as string | undefined) ?? null,
    created_at: tsToIso(d.created_at),
  }
}

export async function setPerfil(
  userId: string,
  data: Partial<{
    academia_id: string | null
    role: Role
    nome_completo: string | null
    telefone: string | null
    cpf: string | null
  }>
) {
  await setDoc(
    doc(getDb(), 'perfis', userId),
    { ...data, updated_at: serverTimestamp() },
    { merge: true }
  )
}

/**
 * Marca o utilizador como aluno convidado (antes do CPF), para não perder vínculo com a academia
 * se o sessionStorage falhar ou for limpo.
 */
export async function seedAlunoInviteProfile(params: {
  userId: string
  academia_id: string
  nome_completo?: string | null
  telefone?: string | null
}): Promise<void> {
  const { userId, academia_id, nome_completo, telefone } = params
  await setDoc(
    doc(getDb(), 'perfis', userId),
    {
      role: 'ALUNO',
      academia_id,
      nome_completo: nome_completo ?? null,
      telefone: telefone ?? null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  )
}

/**
 * Garante 1 CPF = 1 conta (documento cpf_claims/{cpf11} com user_id).
 * Usar após createUserWithEmailAndPassword ou signInWithPopup (Google).
 */
export async function registerPerfilAndClaimCpf(params: {
  userId: string
  cpfDigits: string
  nome_completo: string
  role: Role
  academia_id: string
  telefone?: string | null
}): Promise<void> {
  const { userId, cpfDigits, nome_completo, role, academia_id, telefone } = params
  const db = getDb()
  const claimRef = doc(db, 'cpf_claims', cpfDigits)
  const perfilRef = doc(db, 'perfis', userId)
  await runTransaction(db, async (tx) => {
    const claimSnap = await tx.get(claimRef)
    if (claimSnap.exists()) {
      const owner = claimSnap.data()?.user_id as string | undefined
      if (owner && owner !== userId) throw new CpfAlreadyRegisteredError()
    }
    const perfilSnap = await tx.get(perfilRef)
    if (perfilSnap.exists()) {
      const oldCpf = perfilSnap.data()?.cpf as string | undefined
      if (oldCpf && oldCpf !== cpfDigits) {
        throw new CpfAlreadyRegisteredError(
          'Este perfil já está vinculado a outro CPF. Não é possível usar um CPF diferente.'
        )
      }
    }
    tx.set(claimRef, { user_id: userId, created_at: serverTimestamp() })
    tx.set(
      perfilRef,
      {
        nome_completo,
        role,
        academia_id,
        telefone: telefone ?? null,
        cpf: cpfDigits,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true }
    )
  })
}

export async function createAcademia(nome: string) {
  const ref = await addDoc(collection(getDb(), 'academias'), {
    nome,
    created_at: serverTimestamp(),
  })
  return ref.id
}

export async function listAlunosByAcademia(academiaId: string) {
  const q = query(
    collection(getDb(), 'perfis'),
    where('academia_id', '==', academiaId),
    where('role', '==', 'ALUNO')
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => ({
    id: s.id,
    nome_completo: s.data().nome_completo ?? '',
    telefone: s.data().telefone ?? null,
    created_at: tsToIso(s.data().created_at),
  }))
}

export async function listPlanos(academiaId: string, ativoOnly = true) {
  const q = query(collection(getDb(), 'planos'), where('academia_id', '==', academiaId))
  const snap = await getDocs(q)
  let rows = snap.docs.map((s) => ({
    id: s.id,
    ...s.data(),
    criado_em: tsToIso(s.data().criado_em),
  })) as Record<string, unknown>[]
  if (ativoOnly) rows = rows.filter((p) => p.ativo !== false)
  rows.sort((a, b) => Number(a.valor) - Number(b.valor))
  return rows
}

export async function insertPlano(data: Record<string, unknown>) {
  const ref = await addDoc(collection(getDb(), 'planos'), {
    ...data,
    criado_em: serverTimestamp(),
  })
  return ref.id
}

export async function listMatriculas(academiaId: string) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    orderBy('data_vencimento', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => {
    const d = s.data()
    return {
      id: s.id,
      status: d.status,
      data_inicio: d.data_inicio,
      data_vencimento: d.data_vencimento,
      valor_pago: d.valor_pago ?? null,
      aluno_id: d.aluno_id,
      plano_id: d.plano_id ?? null,
      criado_em: tsToIso(d.criado_em),
      perfis: { nome_completo: d.aluno_nome ?? null },
      planos:
        d.plano_nome != null
          ? { nome: d.plano_nome, valor: Number(d.plano_valor ?? 0) }
          : null,
    }
  })
}

export async function listMatriculasByDataInicio(
  academiaId: string,
  minDataInicio: string
) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    where('data_inicio', '>=', minDataInicio)
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function listMatriculasByAluno(alunoId: string) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('aluno_id', '==', alunoId),
    orderBy('data_vencimento', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => {
    const d = s.data()
    return {
      id: s.id,
      status: d.status,
      data_inicio: d.data_inicio,
      data_vencimento: d.data_vencimento,
      valor_pago: d.valor_pago ?? null,
      planos:
        d.plano_nome != null
          ? {
              nome: d.plano_nome,
              valor: Number(d.plano_valor ?? 0),
              duracao_dias: d.plano_duracao_dias ?? 30,
            }
          : null,
    }
  })
}

export async function insertMatricula(data: Record<string, unknown>) {
  const ref = await addDoc(collection(getDb(), 'matriculas'), {
    ...data,
    criado_em: serverTimestamp(),
  })
  return ref.id
}

/** Insert matrícula with denormalized aluno/plano fields for lists and exports. */
export async function insertMatriculaFull(data: {
  academia_id: string
  aluno_id: string
  plano_id: string | null
  data_inicio: string
  data_vencimento: string
  valor_pago?: number | null
  observacoes?: string | null
  status: string
}) {
  const alunoSnap = await getDoc(doc(getDb(), 'perfis', data.aluno_id))
  const al = alunoSnap.data()
  let plano_nome: string | null = null
  let plano_valor: number | null = null
  let plano_duracao_dias = 30
  if (data.plano_id) {
    const pSnap = await getDoc(doc(getDb(), 'planos', data.plano_id))
    if (pSnap.exists()) {
      const pl = pSnap.data()!
      plano_nome = (pl.nome as string) ?? null
      plano_valor = pl.valor != null ? Number(pl.valor) : null
      plano_duracao_dias = Number(pl.duracao_dias ?? 30)
    }
  }
  return insertMatricula({
    ...data,
    aluno_nome: (al?.nome_completo as string) ?? '',
    aluno_telefone: (al?.telefone as string) ?? '',
    plano_nome,
    plano_valor,
    plano_duracao_dias,
  })
}

export async function updateMatricula(id: string, data: Record<string, unknown>) {
  await updateDoc(doc(getDb(), 'matriculas', id), data)
}

export async function listFichasByAluno(alunoId: string) {
  const q = query(
    collection(getDb(), 'fichas_treino'),
    where('aluno_id', '==', alunoId),
    orderBy('criado_em', 'desc')
  )
  const snap = await getDocs(q)
  const fichas = []
  for (const f of snap.docs) {
    const d = f.data()
    const exQ = query(
      collection(getDb(), 'exercicios'),
      where('ficha_id', '==', f.id),
      orderBy('ordem', 'asc')
    )
    const exSnap = await getDocs(exQ)
    const exercicios = exSnap.docs.map((e) => ({ id: e.id, ...e.data() })) as Record<
      string,
      unknown
    >[]
    fichas.push({
      id: f.id,
      nome: d.nome,
      objetivo: d.objetivo ?? '',
      criado_em: tsToIso(d.criado_em),
      exercicios,
    })
  }
  return fichas
}

export async function listFichasByAcademia(academiaId: string) {
  const q = query(
    collection(getDb(), 'fichas_treino'),
    where('academia_id', '==', academiaId),
    orderBy('criado_em', 'desc')
  )
  const snap = await getDocs(q)
  const out = []
  for (const f of snap.docs) {
    const d = f.data()
    let nomeAluno = ''
    if (d.aluno_id) {
      const p = await getDoc(doc(getDb(), 'perfis', d.aluno_id as string))
      nomeAluno = (p.data()?.nome_completo as string) ?? ''
    }
    const exQ = query(
      collection(getDb(), 'exercicios'),
      where('ficha_id', '==', f.id),
      orderBy('ordem', 'asc')
    )
    const exSnap = await getDocs(exQ)
    const exercicios = exSnap.docs.map((e) => ({ id: e.id, ...e.data() })) as Record<
      string,
      unknown
    >[]
    out.push({
      id: f.id,
      nome: d.nome,
      objetivo: d.objetivo ?? null,
      aluno_id: d.aluno_id,
      criado_em: tsToIso(d.criado_em),
      perfis: { nome_completo: nomeAluno },
      exercicios,
    })
  }
  return out
}

export async function insertFicha(data: Record<string, unknown>) {
  const ref = await addDoc(collection(getDb(), 'fichas_treino'), {
    ...data,
    criado_em: serverTimestamp(),
  })
  return { id: ref.id }
}

export async function insertExercicios(rows: Record<string, unknown>[]) {
  for (const row of rows) {
    await addDoc(collection(getDb(), 'exercicios'), row)
  }
}

export async function deleteFicha(id: string) {
  const exQ = query(collection(getDb(), 'exercicios'), where('ficha_id', '==', id))
  const exSnap = await getDocs(exQ)
  for (const e of exSnap.docs) {
    await deleteDoc(e.ref)
  }
  await deleteDoc(doc(getDb(), 'fichas_treino', id))
}

export async function insertRegistroCarga(data: Record<string, unknown>) {
  await addDoc(collection(getDb(), 'registros_carga'), {
    ...data,
    carga: typeof data.carga === 'string' ? parseFloat(data.carga as string) : data.carga,
    data_registro: data.data_registro ?? new Date().toISOString(),
  })
}

export async function listRegistrosCarga(alunoId: string, exercicioId: string) {
  const q = query(
    collection(getDb(), 'registros_carga'),
    where('aluno_id', '==', alunoId),
    where('exercicio_id', '==', exercicioId),
    orderBy('data_registro', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function countPerfisRole(academiaId: string, role: Role) {
  const q = query(
    collection(getDb(), 'perfis'),
    where('academia_id', '==', academiaId),
    where('role', '==', role)
  )
  return (await getDocs(q)).size
}

export async function countFichasAcademia(academiaId: string) {
  const q = query(
    collection(getDb(), 'fichas_treino'),
    where('academia_id', '==', academiaId)
  )
  return (await getDocs(q)).size
}

export async function matriculasCriadasDesde(academiaId: string, isoStart: string) {
  const start = Timestamp.fromDate(new Date(isoStart))
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    where('criado_em', '>=', start)
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => ({ id: s.id, ...s.data() }))
}

export async function matriculasRecentes(academiaId: string, n = 5) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    orderBy('criado_em', 'desc'),
    limit(n)
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => {
    const d = s.data()
    return {
      id: s.id,
      valor_pago: d.valor_pago,
      criado_em: tsToIso(d.criado_em),
      perfis: { nome_completo: d.aluno_nome },
      planos: { nome: d.plano_nome },
    }
  })
}

export async function matriculasTodas(academiaId: string) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    orderBy('criado_em', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((s) => {
    const d = s.data()
    return {
      id: s.id,
      valor_pago: d.valor_pago,
      criado_em: tsToIso(d.criado_em),
      status: d.status,
      perfis: { nome_completo: d.aluno_nome },
      planos: { nome: d.plano_nome },
    }
  })
}

export async function getPlano(planoId: string) {
  const snap = await getDoc(doc(getDb(), 'planos', planoId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Record<string, unknown>
}

export async function vencimentosProximos(academiaId: string) {
  const q = query(
    collection(getDb(), 'matriculas'),
    where('academia_id', '==', academiaId),
    where('status', '==', 'ATIVO')
  )
  const snap = await getDocs(q)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limitDate = new Date(today)
  limitDate.setDate(limitDate.getDate() + 7)
  const rows: Record<string, unknown>[] = []
  for (const s of snap.docs) {
    const m = s.data()
    const dv = new Date(m.data_vencimento as string)
    dv.setHours(0, 0, 0, 0)
    if (dv > limitDate) continue
    const status_vencimento =
      dv < today ? 'VENCIDO' : dv <= limitDate ? 'VENCENDO_EM_BREVE' : 'EM_DIA'
    rows.push({
      matricula_id: s.id,
      aluno_nome: m.aluno_nome ?? '',
      aluno_telefone: m.aluno_telefone ?? '',
      plano_nome: m.plano_nome ?? '',
      data_vencimento: m.data_vencimento,
      academia_id: academiaId,
      status_vencimento,
      dias_para_vencimento: Math.round((dv.getTime() - today.getTime()) / 86400000),
    })
  }
  rows.sort(
    (a, b) =>
      new Date(a.data_vencimento as string).getTime() -
      new Date(b.data_vencimento as string).getTime()
  )
  return rows
}

export async function deletePerfil(userId: string) {
  await deleteDoc(doc(getDb(), 'perfis', userId))
}

/** Remove aluno data (Firestore). Auth user must be removed separately (Admin SDK / console). */
export async function deleteAlunoData(alunoId: string) {
  const matQ = query(
    collection(getDb(), 'matriculas'),
    where('aluno_id', '==', alunoId)
  )
  for (const d of (await getDocs(matQ)).docs) {
    await deleteDoc(d.ref)
  }
  const fichasQ = query(
    collection(getDb(), 'fichas_treino'),
    where('aluno_id', '==', alunoId)
  )
  for (const f of (await getDocs(fichasQ)).docs) {
    await deleteFicha(f.id)
  }
  const regQ = query(
    collection(getDb(), 'registros_carga'),
    where('aluno_id', '==', alunoId)
  )
  for (const r of (await getDocs(regQ)).docs) {
    await deleteDoc(r.ref)
  }
  await deletePerfil(alunoId)
}

export async function getAlunoComAcademia(alunoId: string) {
  const snap = await getDoc(doc(getDb(), 'perfis', alunoId))
  if (!snap.exists()) return null
  const p = snap.data()!
  const ac = p.academia_id
    ? await getDoc(doc(getDb(), 'academias', p.academia_id as string))
    : null
  return {
    ...p,
    id: snap.id,
    created_at: tsToIso(p.created_at),
    academias: ac?.exists() ? { nome: ac.data()?.nome } : null,
  }
}
