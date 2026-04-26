'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getFirebaseCurrentUser } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EvolutionChart } from '@/components/evolution-chart'
import { 
  User, 
  Dumbbell, 
  CreditCard, 
  ChevronLeft, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type Exercicio = {
  id: string
  nome: string
  series: number
  repeticoes: string
  carga: string
  descanso: string
  ordem: number
}

type Ficha = {
  id: string
  nome: string
  objetivo: string | null
  criado_em: string
  exercicios: Exercicio[]
}

type Matricula = {
  id: string
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO'
  data_inicio: string
  data_vencimento: string
  valor_pago: number | null
  planos: { nome: string; valor: number } | null
}

type AlunoDetail = {
  id: string
  nome_completo: string | null
  telefone: string | null
  role: string
  created_at: string
  academia_id: string
}

export default function AlunoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const alunoId = resolvedParams.id
  
  const [aluno, setAluno] = useState<AlunoDetail | null>(null)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'perfil' | 'treinos' | 'financeiro' | 'evolucao'>('perfil')
  const [planos, setPlanos] = useState<any[]>([])
  
  // Renewal modal states
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState('')
  const [renewDate, setRenewDate] = useState('')
  const [renewValor, setRenewValor] = useState('')
  const [isRenewing, setIsRenewing] = useState(false)
  
  const { profile, loading: authLoading, isAdmin, isReceptionist } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    const fetchData = async () => {
      setLoading(true)
      const user = await getFirebaseCurrentUser()
      if (!user) { router.push('/login'); return }

      // 1. Buscar dados básicos do aluno
      const { data: alunoData, error: alunoErr } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', alunoId)
        .single()

      if (alunoErr || !alunoData) {
        console.error('Erro ao buscar aluno:', alunoErr)
        router.push('/alunos')
        return
      }

      setAluno(alunoData as AlunoDetail)

      // 2. Buscar fichas de treino
      const { data: fichasData } = await supabase
        .from('fichas_treino')
        .select('*, exercicios(*)')
        .eq('aluno_id', alunoId)
        .order('criado_em', { ascending: false })

      setFichas((fichasData as Ficha[]) ?? [])

      // 3. Buscar histórico financeiro/matrículas
      const { data: matriculasData } = await supabase
        .from('matriculas')
        .select('*, planos(nome, valor)')
        .eq('aluno_id', alunoId)
        .order('data_vencimento', { ascending: false })

      setMatriculas((matriculasData as unknown as Matricula[]) ?? [])
      
      // 4. Buscar planos disponíveis para renovação
      const { data: planosData } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('valor')
      
      setPlanos(planosData || [])
      
      setLoading(false)
    }

    fetchData()
  }, [alunoId, router])

  const handleRenewMatricula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanoId || !aluno || !renewDate) return
    setIsRenewing(true)

    try {
      const plano = planos.find(p => p.id === selectedPlanoId)
      const dataInicio = new Date(renewDate)
      const dataVencimento = new Date(dataInicio)
      dataVencimento.setDate(dataVencimento.getDate() + (plano?.duracao_dias || 30))

      const { error } = await supabase
        .from('matriculas')
        .insert({
          academia_id: aluno.academia_id,
          aluno_id: alunoId,
          plano_id: selectedPlanoId,
          data_inicio: renewDate,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          valor_pago: parseFloat(renewValor) || plano?.valor,
          status: 'ATIVO'
        })

      if (error) throw error

      setShowRenewModal(false)
      // Atualizar lista de matrículas
      const { data: updatedMatriculas } = await supabase
        .from('matriculas')
        .select('*, planos(nome, valor)')
        .eq('aluno_id', alunoId)
        .order('data_vencimento', { ascending: false })
      
      setMatriculas((updatedMatriculas as unknown as Matricula[]) ?? [])
      alert('Matrícula renovada com sucesso!')
    } catch (err) {
      console.error('Erro ao renovar:', err)
      alert('Erro ao processar renovação.')
    } finally {
      setIsRenewing(false)
    }
  }

  const handleDeleteAluno = async () => {
    if (!isAdmin) return
    if (!confirm('TEM CERTEZA? Isso excluirá permanentemente o aluno, suas matrículas e treinos.')) return
    
    try {
      const { error } = await supabase.from('perfis').delete().eq('id', alunoId)
      if (error) throw error
      alert('Aluno excluído com sucesso.')
      router.push('/alunos')
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir aluno.')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
      </div>
    )
  }

  const matriculaAtiva = matriculas.find(m => m.status === 'ATIVO')
  const statusMatricula = matriculaAtiva ? 'ATIVO' : (matriculas[0]?.status || 'SEM MATRÍCULA')

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => router.push('/alunos')}
          className="flex items-center gap-2 text-[#A6A6A6] hover:text-white transition-colors mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para lista de alunos
        </button>

        {/* Profile Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#585759]/30">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-[#F2B705]/10 rounded-2xl flex items-center justify-center border border-[#F2B705]/20 shadow-lg shadow-[#F2B705]/5">
              <User className="w-10 h-10 text-[#F2B705]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{aluno?.nome_completo || 'Sem Nome'}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  statusMatricula === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {statusMatricula}
                </span>
                <span className="text-[#585759]">•</span>
                <span className="text-[#A6A6A6]">Aluno desde {new Date(aluno?.created_at || '').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button 
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold"
                onClick={handleDeleteAluno}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-lg shadow-[#25D366]/20 border-none"
              onClick={() => {
                const tel = aluno?.telefone?.replace(/\D/g, '')
                if (tel) window.open(`https://wa.me/55${tel}`, '_blank')
              }}
            >
              <svg 
                className="w-5 h-5 mr-2 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 mb-6 border-b border-[#585759]/30">
          {[
            { id: 'perfil', label: 'Visão Geral', icon: <User className="w-4 h-4" /> },
            { id: 'treinos', label: 'Treinos', icon: <Dumbbell className="w-4 h-4" /> },
            { id: 'evolucao', label: 'Evolução', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
            { id: 'financeiro', label: 'Financeiro', icon: <CreditCard className="w-4 h-4" /> }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all -mb-px ${
                activeTab === t.id 
                  ? 'text-[#F2B705] border-b-2 border-[#F2B705]' 
                  : 'text-[#A6A6A6] hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'perfil' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-[#0D0D0D] border-[#585759]/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-[#F2B705]" /> Dados Cadastrais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Nome Completo</p>
                    <p className="text-white mt-1">{aluno?.nome_completo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Telefone</p>
                    <p className="text-white mt-1">{aluno?.telefone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">E-mail</p>
                    {/* Nota: perfil não tem email, o auth.users tem. Mostramos apenas se disponível no metadata */}
                    <p className="text-white mt-1">Vinculado ao sistema</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D0D0D] border-[#585759]/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#F2B705]" /> Histórico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Matrícula Atual</p>
                      <p className="text-white mt-1">{matriculaAtiva?.planos?.nome || 'Nenhum plano ativo'}</p>
                    </div>
                    {matriculaAtiva && (
                      <div className="text-right">
                        <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Vencimento</p>
                        <p className={`mt-1 font-bold ${
                          new Date(matriculaAtiva.data_vencimento) <= new Date(Date.now() + 7 * 86400000) ? 'text-red-400' : 'text-[#F2B705]'
                        }`}>
                          {new Date(matriculaAtiva.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Total de Fichas</p>
                    <p className="text-white mt-1">{fichas.length} fichas cadastradas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'treinos' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {fichas.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#585759]/30 rounded-2xl">
                  <Dumbbell className="w-10 h-10 text-[#585759] mx-auto mb-3" />
                  <p className="text-[#A6A6A6]">Este aluno ainda não possui fichas de treino.</p>
                  <Button 
                    variant="link" 
                    className="text-[#F2B705] mt-2"
                    onClick={() => router.push('/treinos')}
                  >
                    Ir para Gestão de Treinos
                  </Button>
                </div>
              ) : (
                fichas.map((ficha) => (
                  <div key={ficha.id} className="border border-[#585759]/40 rounded-xl overflow-hidden bg-[#0D0D0D]/40">
                    <div className="p-4 bg-[#585759]/10 flex items-center justify-between border-b border-[#585759]/20">
                      <div>
                        <h4 className="text-white font-bold">{ficha.nome}</h4>
                        <p className="text-[#A6A6A6] text-xs">{ficha.objetivo || 'Sem objetivo definido'}</p>
                      </div>
                      <span className="text-[#585759] text-xs">
                        Criada em {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#585759] uppercase text-[10px] tracking-widest text-left">
                            <th className="pb-3 pr-4">Exercício</th>
                            <th className="pb-3 px-2 text-center">Séries</th>
                            <th className="pb-3 px-2 text-center">Reps</th>
                            <th className="pb-3 px-2 text-center">Carga</th>
                            <th className="pb-3 px-2 text-center">Rest</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#585759]/10">
                          {ficha.exercicios.map((ex, i) => (
                            <tr key={i} className="text-[#A6A6A6]">
                              <td className="py-2.5 pr-4 text-white font-medium">{ex.nome}</td>
                              <td className="py-2.5 px-2 text-center">{ex.series}</td>
                              <td className="py-2.5 px-2 text-center">{ex.repeticoes}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-[#F2B705]">{ex.carga || '—'}</td>
                              <td className="py-2.5 px-2 text-center text-xs">{ex.descanso}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'evolucao' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {fichas.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#585759]/30 rounded-2xl">
                  <Dumbbell className="w-10 h-10 text-[#585759] mx-auto mb-3" />
                  <p className="text-[#A6A6A6]">Nenhum dado de evolução disponível.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {fichas.map(ficha => (
                    <div key={ficha.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#585759]/20" />
                        <h3 className="text-[#A6A6A6] text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full border border-[#585759]/30 bg-[#585759]/5">
                          {ficha.nome}
                        </h3>
                        <div className="h-px flex-1 bg-[#585759]/20" />
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ficha.exercicios.map(ex => (
                          <Card key={ex.id} className="bg-[#0D0D0D] border-[#585759]/30 overflow-hidden group hover:border-[#F2B705]/30 transition-colors">
                            <CardHeader className="pb-2 border-b border-[#585759]/10">
                              <CardTitle className="text-white text-sm font-bold flex items-center justify-between">
                                {ex.nome}
                                <span className="text-[10px] text-[#A6A6A6] font-normal uppercase">Meta: {ex.carga || 'Livre'}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <EvolutionChart exercicioId={ex.id} alunoId={alunoId} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'financeiro' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {matriculas.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#585759]/30 rounded-2xl">
                  <CreditCard className="w-10 h-10 text-[#585759] mx-auto mb-3" />
                  <p className="text-[#A6A6A6]">Nenhum histórico financeiro encontrado.</p>
                  <Button 
                    variant="link" 
                    className="text-[#F2B705] mt-2"
                    onClick={() => router.push('/planos')}
                  >
                    Ir para Matrículas
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">Histórico de Pagamentos</h2>
                    <Button 
                      onClick={() => {
                        const latestVenc = matriculas[0]?.data_vencimento || new Date().toISOString().split('T')[0]
                        setRenewDate(latestVenc)
                        setShowRenewModal(true)
                      }}
                      className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Renovar Matrícula
                    </Button>
                  </div>
                  <div className="border border-[#585759]/50 rounded-xl overflow-hidden shadow-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-[#585759]/10 text-[#585759] uppercase text-xs tracking-wider text-left">
                      <tr>
                        <th className="p-4 text-left">Plano</th>
                        <th className="p-4">Início</th>
                        <th className="p-4">Vencimento</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#585759]/20">
                      {matriculas.map((m) => (
                        <tr key={m.id} className="hover:bg-[#585759]/5 transition-colors">
                          <td className="p-4 text-white font-medium">{m.planos?.nome || 'Personalizado'}</td>
                          <td className="p-4 text-[#A6A6A6]">{new Date(m.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 text-[#A6A6A6]">{new Date(m.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 text-[#F2B705] font-bold">R$ {m.valor_pago?.toFixed(2).replace('.', ',') || '—'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-400' : 
                              m.status === 'VENCIDO' ? 'bg-red-500/20 text-red-400' : 'bg-[#585759]/30 text-[#A6A6A6]'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Modal de Renovação Rápida */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold">Renovar Matrícula</h2>
              <button onClick={() => setShowRenewModal(false)} className="text-[#A6A6A6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenewMatricula} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-[#A6A6A6] uppercase font-bold tracking-wider">Novo Plano</label>
                <select 
                  value={selectedPlanoId} 
                  onChange={e => {
                    setSelectedPlanoId(e.target.value)
                    const p = planos.find(pl => pl.id === e.target.value)
                    if (p) setRenewValor(p.valor.toString())
                  }} 
                  required
                  className="w-full h-11 px-4 rounded-xl bg-[#0D0D0D] border border-[#585759]/50 text-white focus:border-[#F2B705] outline-none transition-all"
                >
                  <option value="">Selecione um plano...</option>
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#A6A6A6] uppercase font-bold tracking-wider">Data de Início</label>
                  <input 
                    type="date" 
                    value={renewDate} 
                    onChange={e => setRenewDate(e.target.value)} 
                    required
                    className="w-full h-11 px-4 rounded-xl bg-[#0D0D0D] border border-[#585759]/50 text-white focus:border-[#F2B705] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[#A6A6A6] uppercase font-bold tracking-wider">Valor Pago (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={renewValor} 
                    onChange={e => setRenewValor(e.target.value)} 
                    placeholder="Auto"
                    className="w-full h-11 px-4 rounded-xl bg-[#0D0D0D] border border-[#585759]/50 text-white focus:border-[#F2B705] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 px-4 py-3 border border-[#585759]/50 rounded-xl text-white font-bold hover:bg-[#585759]/20 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isRenewing || !selectedPlanoId}
                  className="flex-1 px-4 py-3 bg-[#F2B705] hover:bg-[#BF9004] disabled:opacity-50 disabled:hover:bg-[#F2B705] text-[#0D0D0D] font-bold rounded-xl shadow-lg shadow-[#F2B705]/20 transition-all"
                >
                  {isRenewing ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
