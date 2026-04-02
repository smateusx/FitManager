'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Dumbbell, 
  CreditCard, 
  ChevronLeft, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react'

type Exercicio = {
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
  const [activeTab, setActiveTab] = useState<'perfil' | 'treinos' | 'financeiro'>('perfil')
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

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
      
      setLoading(false)
    }

    fetchData()
  }, [alunoId, router])

  if (loading) {
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
            <Button 
              variant="outline" 
              className="border-[#585759] text-[#A6A6A6] hover:text-white hover:bg-[#585759]/20"
              onClick={() => {
                const tel = aluno?.telefone?.replace(/\D/g, '')
                if (tel) window.open(`https://wa.me/55${tel}`, '_blank')
              }}
            >
              <Phone className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 mb-6 border-b border-[#585759]/30">
          {[
            { id: 'perfil', label: 'Visão Geral', icon: <User className="w-4 h-4" /> },
            { id: 'treinos', label: 'Treinos', icon: <Dumbbell className="w-4 h-4" /> },
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
