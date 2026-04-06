'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

  // Modal criar plano
  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [nomePlano, setNomePlano] = useState('')
  const [descPlano, setDescPlano] = useState('')
  const [valorPlano, setValorPlano] = useState('')
  const [duracaoPlano, setDuracaoPlano] = useState('30')
  const [savingPlano, setSavingPlano] = useState(false)

  // Modal criar matrícula
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: perfil } = await supabase.from('perfis').select('academia_id').eq('id', session.user.id).single()
    if (perfil) setAcademiaId(perfil.academia_id)

    const [{ data: planosData }, { data: matriculasData }, { data: alunosData }] = await Promise.all([
      supabase.from('planos').select('*').eq('ativo', true).order('valor'),
      supabase.from('matriculas').select('*, perfis(nome_completo), planos(nome, valor)').order('data_vencimento', { ascending: true }),
      supabase.from('perfis').select('id, nome_completo').eq('role', 'ALUNO'),
    ])

    setPlanos((planosData as Plano[]) ?? [])
    setMatriculas((matriculasData as unknown as Matricula[]) ?? [])
    setAlunos((alunosData as AlunoOption[]) ?? [])
    setLoading(false)
  }

  // Calcula data de vencimento automaticamente ao mudar plano selecionado
  const calcVencimento = (planoId: string, inicio: string) => {
    const plano = planos.find(p => p.id === planoId)
    if (!plano || !inicio) return ''
    const d = new Date(inicio)
    d.setDate(d.getDate() + plano.duracao_dias)
    return d.toISOString().split('T')[0]
  }

  const handleSavePlano = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || isReceptionist) return
    setSavingPlano(true)
    await supabase.from('planos').insert({
      nome: nomePlano, descricao: descPlano,
      valor: parseFloat(valorPlano), duracao_dias: parseInt(duracaoPlano),
      academia_id: academiaId
    })
    setSavingPlano(false)
    setShowPlanoModal(false)
    setNomePlano(''); setDescPlano(''); setValorPlano(''); setDuracaoPlano('30')
    fetchAll()
  }

  const handleSaveMatricula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !matAlunoId || !matPlanoId) return
    setSavingMat(true)
    const vencimento = calcVencimento(matPlanoId, matInicio)
    await supabase.from('matriculas').insert({
      academia_id: academiaId,
      aluno_id: matAlunoId,
      plano_id: matPlanoId,
      data_inicio: matInicio,
      data_vencimento: vencimento,
      valor_pago: matValorPago ? parseFloat(matValorPago) : null,
      observacoes: matObs || null,
      status: 'ATIVO'
    })
    setSavingMat(false)
    setShowMatriculaModal(false)
    setMatAlunoId(''); setMatPlanoId(''); setMatObs(''); setMatValorPago('')
    fetchAll()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('matriculas').update({ status }).eq('id', id)
    fetchAll()
  }

  const ativos = matriculas.filter(m => m.status === 'ATIVO').length
  const vencidos = matriculas.filter(m => m.status === 'VENCIDO').length
  const receitaMes = matriculas.filter(m => m.status === 'ATIVO').reduce((sum, m) => sum + (m.valor_pago ?? 0), 0)

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Planos & Pagamentos</h1>
            <p className="text-[#A6A6A6] mt-1">Gerencie matrículas e controle financeiro da academia.</p>
          </div>
          <div className="flex gap-3">
            {!isReceptionist && (
              <Button onClick={() => setShowPlanoModal(true)} variant="outline"
                className="border-[#585759] text-white hover:bg-[#585759]/20">
                <Plus className="w-4 h-4 mr-2" /> Novo Plano
              </Button>
            )}
            <Button onClick={() => setShowMatriculaModal(true)}
              className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20">
              <Plus className="w-4 h-4 mr-2" /> Nova Matrícula
            </Button>
          </div>
        </header>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            {[
              { label: 'Matrículas Ativas', value: ativos, icon: <Users className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Vencidas', value: vencidos, icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: isReceptionist ? 'Faturamento Atual' : 'Receita (ativas)', value: `R$ ${receitaMes.toFixed(2).replace('.', ',')}`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-[#F2B705]', bg: 'bg-[#F2B705]/10' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0D0D0D]/80 border border-[#585759]/50 rounded-xl p-5 flex items-center gap-4">
                <div className={`${s.bg} p-3 rounded-xl`}><span className={s.color}>{s.icon}</span></div>
                <div>
                  <p className="text-[#A6A6A6] text-xs uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-8 mb-6 border-b border-[#585759]/30">
          {(['matriculas', 'planos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-all -mb-px ${tab === t
                ? 'text-[#F2B705] border-b-2 border-[#F2B705]'
                : 'text-[#A6A6A6] hover:text-white'}`}>
              {t === 'matriculas' ? 'Matrículas' : 'Planos Cadastrados'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : tab === 'matriculas' ? (
          /* Matriculas Table */
          <div className="border border-[#585759]/50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#585759]/10">
                <tr className="text-[#585759] uppercase text-xs tracking-wider">
                  <th className="text-left p-4">Aluno</th>
                  <th className="text-left p-4">Plano</th>
                  <th className="text-left p-4">Vencimento</th>
                  <th className="text-left p-4">Valor Pago</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#585759]/20">
                {matriculas.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[#585759]">Nenhuma matrícula cadastrada ainda.</td></tr>
                ) : matriculas.map((m) => {
                  const vencendo = new Date(m.data_vencimento) <= new Date(Date.now() + 7 * 86400000)
                  return (
                    <tr key={m.id} className="hover:bg-[#585759]/5 transition-colors">
                      <td className="p-4 text-white font-medium">{m.perfis?.nome_completo || 'Sem nome'}</td>
                      <td className="p-4 text-[#A6A6A6]">{m.planos?.nome || '—'}</td>
                      <td className="p-4">
                        <span className={vencendo && m.status === 'ATIVO' ? 'text-red-400 font-semibold' : 'text-[#A6A6A6]'}>
                          {new Date(m.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {vencendo && m.status === 'ATIVO' && ' ⚠️'}
                        </span>
                      </td>
                      <td className="p-4 text-[#A6A6A6]">
                        {m.valor_pago != null ? `R$ ${m.valor_pago.toFixed(2).replace('.', ',')}` : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select value={m.status}
                          onChange={(e) => handleStatusChange(m.id, e.target.value)}
                          className="text-xs bg-[#0D0D0D] border border-[#585759] text-[#A6A6A6] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F2B705]">
                          <option value="ATIVO">Ativo</option>
                          <option value="VENCIDO">Vencido</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Planos Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {planos.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-[#585759]">Nenhum plano cadastrado ainda.</div>
            ) : planos.map((p) => (
              <div key={p.id} className="border border-[#585759]/50 rounded-xl p-6 bg-[#0D0D0D]/80 hover:border-[#F2B705]/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-[#F2B705]" />
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg">{p.nome}</h3>
                {p.descricao && <p className="text-[#A6A6A6] text-sm mt-1">{p.descricao}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#F2B705]">
                    R$ {p.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-[#585759] text-sm mt-1">{p.duracao_dias} dias de acesso</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Plano */}
      {showPlanoModal && !isReceptionist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Novo Plano</h2>
              <button onClick={() => setShowPlanoModal(false)} className="text-[#A6A6A6] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePlano} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Nome do Plano</Label>
                <Input value={nomePlano} onChange={e => setNomePlano(e.target.value)} required
                  placeholder="Ex: Plano Mensal"
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Descrição (opcional)</Label>
                <Input value={descPlano} onChange={e => setDescPlano(e.target.value)}
                  placeholder="Ex: Acesso ilimitado à academia"
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Valor (R$)</Label>
                  <Input type="number" value={valorPlano} onChange={e => setValorPlano(e.target.value)} required min="0" step="0.01"
                    placeholder="150.00"
                    className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Duração (dias)</Label>
                  <Input type="number" value={duracaoPlano} onChange={e => setDuracaoPlano(e.target.value)} required min="1"
                    className="bg-[#0D0D0D] border-[#585759] text-white focus-visible:ring-[#F2B705]" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowPlanoModal(false)} className="text-[#A6A6A6]">Cancelar</Button>
                <Button type="submit" disabled={savingPlano} className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold">
                  {savingPlano ? 'Salvando...' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Matrícula */}
      {showMatriculaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Nova Matrícula</h2>
              <button onClick={() => setShowMatriculaModal(false)} className="text-[#A6A6A6] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveMatricula} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Aluno</Label>
                <select value={matAlunoId} onChange={e => setMatAlunoId(e.target.value)} required
                  className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#585759] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705]">
                  <option value="">Selecione um aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome_completo || 'Sem nome'}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Plano</Label>
                <select value={matPlanoId} onChange={e => setMatPlanoId(e.target.value)} required
                  className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#585759] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705]">
                  <option value="">Selecione um plano...</option>
                  {planos.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor.toFixed(2)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Data de Início</Label>
                  <Input type="date" value={matInicio} onChange={e => setMatInicio(e.target.value)} required
                    className="bg-[#0D0D0D] border-[#585759] text-white focus-visible:ring-[#F2B705]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Vencimento</Label>
                  <Input type="date" value={calcVencimento(matPlanoId, matInicio)} readOnly
                    placeholder="Auto"
                    className="bg-[#585759]/20 border-[#585759] text-[#A6A6A6] cursor-default" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Valor Pago (R$)</Label>
                <Input type="number" value={matValorPago} onChange={e => setMatValorPago(e.target.value)} min="0" step="0.01"
                  placeholder="Deixe vazio se ainda não pagou"
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A6A6A6]">Observações (opcional)</Label>
                <Input value={matObs} onChange={e => setMatObs(e.target.value)}
                  placeholder="Ex: Pagou em dinheiro"
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowMatriculaModal(false)} className="text-[#A6A6A6]">Cancelar</Button>
                <Button type="submit" disabled={savingMat || !matPlanoId || !matAlunoId}
                  className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold">
                  {savingMat ? 'Salvando...' : 'Matricular'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
