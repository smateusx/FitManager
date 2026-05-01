'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import {
  getPerfil,
  insertMatriculaFull,
  insertPlano,
  listMatriculas,
  listPlanos,
  listAlunosByAcademia,
  updateMatricula,
} from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, CreditCard, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type Plano = {
  id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_dias: number
  ativo: boolean
}

type Matricula = {
  id: string
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO'
  data_inicio: string
  data_vencimento: string
  valor_pago: number | null
  aluno_id: string
  plano_id: string | null
  perfis: { nome_completo: string | null }
  planos: { nome: string; valor: number } | null
}

type AlunoOption = { id: string; nome_completo: string | null }

const STATUS_COLORS = {
  ATIVO: 'bg-emerald-500/20 text-emerald-400',
  VENCIDO: 'bg-red-500/20 text-red-400',
  CANCELADO: 'bg-[#585759]/20 text-[#A6A6A6]',
}

export default function PlanosPage() {
  const { profile, loading: authLoading, isAdmin, isReceptionist } = useAuth()
  const [tab, setTab] = useState<'matriculas' | 'planos'>('matriculas')
  const [planos, setPlanos] = useState<Plano[]>([])
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [alunos, setAlunos] = useState<AlunoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [academiaId, setAcademiaId] = useState<string | null>(null)

  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [nomePlano, setNomePlano] = useState('')
  const [descPlano, setDescPlano] = useState('')
  const [valorPlano, setValorPlano] = useState('')
  const [duracaoPlano, setDuracaoPlano] = useState('30')
  const [savingPlano, setSavingPlano] = useState(false)

  const [showMatriculaModal, setShowMatriculaModal] = useState(false)
  const [matAlunoId, setMatAlunoId] = useState('')
  const [matPlanoId, setMatPlanoId] = useState('')
  const [matInicio, setMatInicio] = useState(new Date().toISOString().split('T')[0])
  const [matValorPago, setMatValorPago] = useState('')
  const [matObs, setMatObs] = useState('')
  const [savingMat, setSavingMat] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    fetchAll()
  }, [authLoading])

  const fetchAll = async () => {
    setLoading(true)
    const u = getFirebaseAuth().currentUser
    if (!u) {
      router.push('/login')
      return
    }

    const perfil = await getPerfil(u.uid)
    if (perfil?.academia_id) setAcademiaId(perfil.academia_id)
    const aid = perfil?.academia_id
    if (!aid) {
      setLoading(false)
      return
    }

    const [planosData, matriculasData, alunosData] = await Promise.all([
      listPlanos(aid, true),
      listMatriculas(aid),
      listAlunosByAcademia(aid).then((rows) =>
        rows.map((r) => ({ id: r.id, nome_completo: r.nome_completo }))
      ),
    ])

    setPlanos(planosData as Plano[])
    setMatriculas(matriculasData as unknown as Matricula[])
    setAlunos(alunosData)
    setLoading(false)
  }

  const calcVencimento = (planoId: string, inicio: string) => {
    const plano = planos.find((p) => p.id === planoId)
    if (!plano || !inicio) return ''
    const d = new Date(inicio)
    d.setDate(d.getDate() + plano.duracao_dias)
    return d.toISOString().split('T')[0]
  }

  const handleSavePlano = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || isReceptionist) return
    setSavingPlano(true)
    await insertPlano({
      nome: nomePlano,
      descricao: descPlano,
      valor: parseFloat(valorPlano),
      duracao_dias: parseInt(duracaoPlano),
      academia_id: academiaId,
      ativo: true,
    })
    setSavingPlano(false)
    setShowPlanoModal(false)
    setNomePlano('')
    setDescPlano('')
    setValorPlano('')
    setDuracaoPlano('30')
    fetchAll()
  }

  const handleSaveMatricula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !matAlunoId || !matPlanoId) return
    setSavingMat(true)
    const vencimento = calcVencimento(matPlanoId, matInicio)
    await insertMatriculaFull({
      academia_id: academiaId,
      aluno_id: matAlunoId,
      plano_id: matPlanoId,
      data_inicio: matInicio,
      data_vencimento: vencimento,
      valor_pago: matValorPago ? parseFloat(matValorPago) : null,
      observacoes: matObs || null,
      status: 'ATIVO',
    })
    setSavingMat(false)
    setShowMatriculaModal(false)
    setMatAlunoId('')
    setMatPlanoId('')
    setMatObs('')
    setMatValorPago('')
    fetchAll()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await updateMatricula(id, { status })
    fetchAll()
  }

  const ativos = matriculas.filter((m) => m.status === 'ATIVO').length
  const vencidos = matriculas.filter((m) => m.status === 'VENCIDO').length
  const receitaMes = matriculas.filter((m) => m.status === 'ATIVO').reduce((sum, m) => sum + (m.valor_pago ?? 0), 0)

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Planos & Pagamentos</h1>
            <p className="text-[#A6A6A6] mt-1">Gerencie matrículas e controle financeiro da academia.</p>
          </div>
          <div className="flex gap-3">
            {!isReceptionist && (
              <Button
                onClick={() => setShowPlanoModal(true)}
                variant="outline"
                className="border-[#585759] text-white hover:bg-[#585759]/20"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Plano
              </Button>
            )}
            <Button
              onClick={() => setShowMatriculaModal(true)}
              className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Matrícula
            </Button>
          </div>
        </header>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            {[
              {
                label: 'Matrículas Ativas',
                value: ativos,
                icon: <Users className="w-5 h-5" />,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                label: 'Vencidas',
                value: vencidos,
                icon: <AlertCircle className="w-5 h-5" />,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
              },
              {
                label: isReceptionist ? 'Faturamento Atual' : 'Receita (ativas)',
                value: `R$ ${receitaMes.toFixed(2).replace('.', ',')}`,
                icon: <TrendingUp className="w-5 h-5" />,
                color: 'text-[#F2B705]',
                bg: 'bg-[#F2B705]/10',
              },
            ].map((s, i) => (
              <div key={i} className="bg-[#0D0D0D]/80 border border-[#585759]/50 rounded-xl p-5 flex items-center gap-4">
                <div className={`${s.bg} p-3 rounded-xl`}>
                  <span className={s.color}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-[#A6A6A6] text-xs uppercase font-bold">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-8 border-b border-[#585759]/30">
          <button
            type="button"
            onClick={() => setTab('matriculas')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'matriculas' ? 'border-[#F2B705] text-[#F2B705]' : 'border-transparent text-[#A6A6A6]'
            }`}
          >
            Matrículas
          </button>
          <button
            type="button"
            onClick={() => setTab('planos')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'planos' ? 'border-[#F2B705] text-[#F2B705]' : 'border-transparent text-[#A6A6A6]'
            }`}
          >
            Planos
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
            </div>
          ) : tab === 'matriculas' ? (
            <div className="space-y-3">
              {matriculas.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 border border-[#585759]/40 rounded-xl p-4"
                >
                  <div>
                    <p className="font-bold text-white">{m.perfis?.nome_completo}</p>
                    <p className="text-sm text-[#A6A6A6]">{m.planos?.nome}</p>
                    <p className="text-xs text-[#585759] mt-1">
                      Vence {new Date(m.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    {!isReceptionist && (
                      <select
                        className="bg-[#0D0D0D] border border-[#585759] rounded px-2 py-1 text-sm text-white"
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value)}
                      >
                        <option value="ATIVO">ATIVO</option>
                        <option value="VENCIDO">VENCIDO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {planos.map((p) => (
                <div key={p.id} className="border border-[#585759]/40 rounded-xl p-4">
                  <p className="font-bold text-white">{p.nome}</p>
                  <p className="text-[#F2B705] font-mono">R$ {Number(p.valor).toFixed(2)}</p>
                  <p className="text-xs text-[#585759]">{p.duracao_dias} dias</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPlanoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSavePlano}
            className="bg-[#0D0D0D] border border-[#585759] rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Novo plano</h2>
              <button type="button" onClick={() => setShowPlanoModal(false)}>
                <X className="w-5 h-5 text-[#585759]" />
              </button>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={nomePlano} onChange={(e) => setNomePlano(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={descPlano} onChange={(e) => setDescPlano(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorPlano}
                  onChange={(e) => setValorPlano(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={duracaoPlano}
                  onChange={(e) => setDuracaoPlano(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPlano} className="w-full bg-[#F2B705] text-[#0D0D0D]">
              Salvar
            </Button>
          </form>
        </div>
      )}

      {showMatriculaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSaveMatricula}
            className="bg-[#0D0D0D] border border-[#585759] rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Nova matrícula</h2>
              <button type="button" onClick={() => setShowMatriculaModal(false)}>
                <X className="w-5 h-5 text-[#585759]" />
              </button>
            </div>
            <div>
              <Label>Aluno</Label>
              <select
                className="w-full mt-1 bg-[#0D0D0D] border border-[#585759] rounded-md px-3 py-2 text-white"
                value={matAlunoId}
                onChange={(e) => setMatAlunoId(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome_completo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Plano</Label>
              <select
                className="w-full mt-1 bg-[#0D0D0D] border border-[#585759] rounded-md px-3 py-2 text-white"
                value={matPlanoId}
                onChange={(e) => setMatPlanoId(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Início</Label>
              <Input type="date" value={matInicio} onChange={(e) => setMatInicio(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Valor pago</Label>
              <Input type="number" step="0.01" value={matValorPago} onChange={(e) => setMatValorPago(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={matObs} onChange={(e) => setMatObs(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={savingMat} className="w-full bg-[#F2B705] text-[#0D0D0D]">
              Salvar
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
