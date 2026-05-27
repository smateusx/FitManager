'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import {
  deleteAlunoData,
  getAlunoComAcademia,
  getPerfil,
  insertMatriculaFull,
  listFichasByAluno,
  listMatriculasByAluno,
  listPlanos,
} from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EvolutionChart } from '@/components/evolution-chart'
import { TreinosPreProntosAluno } from '@/components/treinos-pre-prontos-aluno'
import { TreinoContextBanner } from '@/components/treino-context-banner'
import { FichaSemanalResumo, FichaSemanalView } from '@/components/ficha-semanal-view'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'
import {
  User as UserIcon,
  Dumbbell,
  CreditCard,
  Calendar,
  ChevronLeft,
  Plus,
  X,
  Trash2,
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
  dia_semana?: number | null
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

type PlanoRow = {
  id: string
  nome: string
  valor: number
  duracao_dias?: number
}

type DetailTab = 'perfil' | 'treinos' | 'financeiro' | 'evolucao'

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
  const [activeTab, setActiveTab] = useState<DetailTab>('perfil')
  const [planos, setPlanos] = useState<PlanoRow[]>([])
  
  // Renewal modal states
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState('')
  const [renewDate, setRenewDate] = useState('')
  const [renewValor, setRenewValor] = useState('')
  const [isRenewing, setIsRenewing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAluno, setDeletingAluno] = useState(false)
  const [pageFeedback, setPageFeedback] = useState<{
    variant: InlineFeedbackVariant
    message: string
  } | null>(null)
  
  const { loading: authLoading, isAdmin, isReceptionist } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReceptionist && activeTab === 'financeiro') setActiveTab('perfil')
  }, [isReceptionist, activeTab])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        setLoading(true)
        const u = getFirebaseAuth().currentUser
        if (!u) {
          router.push('/login')
          return
        }

        const alunoData = await getAlunoComAcademia(alunoId)
        if (!alunoData) {
          router.push('/alunos')
          return
        }

        if (cancelled) return

        setAluno({
          id: alunoData.id,
          nome_completo: (alunoData as Record<string, unknown>).nome_completo as string | null,
          telefone: (alunoData as Record<string, unknown>).telefone as string | null,
          role: (alunoData as Record<string, unknown>).role as string,
          created_at: ((alunoData as Record<string, unknown>).created_at as string) || new Date().toISOString(),
          academia_id: (alunoData as Record<string, unknown>).academia_id as string,
        })

        const fichasData = await listFichasByAluno(alunoId)
        setFichas((fichasData as Ficha[]) ?? [])

        const matriculasData = await listMatriculasByAluno(alunoId)
        setMatriculas((matriculasData as unknown as Matricula[]) ?? [])

        const admin = await getPerfil(u.uid)
        if (admin?.academia_id) {
          const planosData = await listPlanos(admin.academia_id, true)
          setPlanos((planosData as PlanoRow[]) || [])
        }

        if (!cancelled) setLoading(false)
      })()
    })

    return () => {
      cancelled = true
    }
  }, [alunoId, router, authLoading])

  const handleRenewMatricula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanoId || !aluno || !renewDate) return
    setIsRenewing(true)

    try {
      const plano = planos.find((p) => p.id === selectedPlanoId)
      const dataInicio = new Date(renewDate)
      const dataVencimento = new Date(dataInicio)
      dataVencimento.setDate(dataVencimento.getDate() + (plano?.duracao_dias || 30))

      await insertMatriculaFull({
        academia_id: aluno.academia_id,
        aluno_id: alunoId,
        plano_id: selectedPlanoId,
        data_inicio: renewDate,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        valor_pago: parseFloat(renewValor) || plano?.valor || 0,
        status: 'ATIVO',
      })

      setShowRenewModal(false)
      const updatedMatriculas = await listMatriculasByAluno(alunoId)
      setMatriculas((updatedMatriculas as unknown as Matricula[]) ?? [])
      setPageFeedback({ variant: 'success', message: 'Matrícula renovada com sucesso.' })
    } catch (err) {
      console.error('Erro ao renovar:', err)
      setPageFeedback({
        variant: 'error',
        message: 'Não foi possível renovar a matrícula. Verifique os dados e tente novamente.',
      })
    } finally {
      setIsRenewing(false)
    }
  }

  const handleDeleteAluno = async () => {
    if (!isAdmin) return
    setDeletingAluno(true)
    try {
      await deleteAlunoData(alunoId)
      router.push('/alunos')
    } catch (err) {
      console.error('Erro ao excluir:', err)
      setDeleteDialogOpen(false)
      setPageFeedback({
        variant: 'error',
        message: 'Não foi possível excluir o aluno. Tente novamente em instantes.',
      })
    } finally {
      setDeletingAluno(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0D0D0D] py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#585759] border-t-[#F2B705]" />
      </div>
    )
  }

  const matriculaAtiva = matriculas.find(m => m.status === 'ATIVO')
  const statusMatricula = matriculaAtiva ? 'ATIVO' : (matriculas[0]?.status || 'SEM MATRÍCULA')

  return (
    <div className="min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => router.push('/alunos')}
          className="flex items-center gap-2 text-[#A6A6A6] hover:text-white transition-colors mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para lista de alunos
        </button>

        {/* Profile Header */}
        <header className="flex flex-col gap-6 border-b border-[#585759]/30 pb-6 sm:flex-row sm:items-start sm:justify-between sm:pb-8 md:items-center">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#F2B705]/20 bg-[#F2B705]/10 shadow-lg shadow-[#F2B705]/5">
              <UserIcon className="h-10 w-10 text-[#F2B705]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{aluno?.nome_completo || 'Sem Nome'}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
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
          <div className="flex shrink-0 flex-wrap gap-2 sm:gap-3">
            {isAdmin && (
              <Button 
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold"
                onClick={() => setDeleteDialogOpen(true)}
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
        <div className="-mx-1 mb-6 mt-6 flex gap-1 overflow-x-auto border-b border-[#585759]/30 px-1">
          {[
            { id: 'perfil' as const, label: 'Visão geral', icon: <UserIcon className="h-4 w-4 shrink-0" /> },
            { id: 'treinos' as const, label: 'Treinos', icon: <Dumbbell className="h-4 w-4 shrink-0" /> },
            {
              id: 'evolucao' as const,
              label: 'Evolução',
              icon: (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              ),
            },
            ...(isReceptionist
              ? []
              : [{ id: 'financeiro' as const, label: 'Financeiro', icon: <CreditCard className="h-4 w-4 shrink-0" /> }]),
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all sm:px-5 ${
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
          {pageFeedback ? (
            <InlineFeedback
              variant={pageFeedback.variant}
              message={pageFeedback.message}
              onDismiss={() => setPageFeedback(null)}
              autoDismissMs={pageFeedback.variant === 'success' ? 4000 : undefined}
              className="mb-6"
            />
          ) : null}

          {activeTab === 'perfil' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-[#0D0D0D] border-[#585759]/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#F2B705]" /> Dados Cadastrais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Nome Completo</p>
                    <p className="text-white mt-1">{aluno?.nome_completo || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[#585759] text-xs uppercase tracking-wider font-semibold">Telefone</p>
                    <p className="text-white mt-1">{aluno?.telefone || 'Não informado'}</p>
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {fichas.length === 0 ? (
                <>
                  <TreinosPreProntosAluno context="admin" />
                  <div className="rounded-2xl border border-dashed border-[#585759]/30 py-12 text-center">
                    <Dumbbell className="mx-auto mb-3 h-10 w-10 text-[#585759]" />
                    <p className="text-[#A6A6A6]">
                      Quando cadastrar uma ficha oficial, o treino sugerido deixa de aparecer para este aluno.
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 text-[#F2B705]"
                      onClick={() => router.push('/treinos')}
                    >
                      Ir para Gestão de Treinos
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <TreinoContextBanner variant="oficial" />
                  <div className="space-y-4">
                    {fichas.map((ficha) => (
                      <div
                        key={ficha.id}
                        className="overflow-hidden rounded-xl border border-[#585759]/40 bg-[#0D0D0D]/40"
                      >
                        <div className="flex items-center justify-between border-b border-[#585759]/20 bg-[#585759]/10 p-4">
                          <div>
                            <h4 className="font-bold text-white">{ficha.nome}</h4>
                            <p className="text-xs text-[#A6A6A6]">{ficha.objetivo || 'Sem objetivo definido'}</p>
                            <div className="mt-1">
                              <FichaSemanalResumo exercicios={ficha.exercicios} />
                            </div>
                          </div>
                          <span className="text-xs text-[#585759]">
                            Criada em {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="p-4">
                          {ficha.exercicios.length === 0 ? (
                            <p className="py-4 text-center text-sm text-[#585759]">Nenhum exercício nesta ficha.</p>
                          ) : (
                            <FichaSemanalView exercicios={ficha.exercicios} variant="table" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                  <div className="-mx-1 mb-4 flex flex-col gap-3 sm:mx-0 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-bold text-white">Histórico de Pagamentos</h2>
                    <Button
                      type="button"
                      onClick={() => {
                        const latestVenc = matriculas[0]?.data_vencimento || new Date().toISOString().split('T')[0]
                        setRenewDate(latestVenc)
                        setShowRenewModal(true)
                      }}
                      className="w-full shrink-0 bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 hover:bg-[#BF9004] sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Renovar Matrícula
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#585759]/50 shadow-xl">
                  <table className="min-w-[560px] w-full text-sm">
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
                          <td className="p-4 text-[#F2B705] font-bold">
                            R$ {m.valor_pago != null ? m.valor_pago.toFixed(2).replace('.', ',') : 'não informado'}
                          </td>
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
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#585759] bg-[#0D0D0D] shadow-2xl animate-in zoom-in-95 duration-200">
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
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} · R$ {p.valor.toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir aluno permanentemente?"
        description={
          <>
            <p>
              Você está prestes a excluir <strong className="text-white">{aluno?.nome_completo || 'este aluno'}</strong>.
              Esta ação não pode ser desfeita.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[#A6A6A6]">
              <li>Perfil e acesso do aluno</li>
              <li>Matrículas e histórico financeiro</li>
              <li>Fichas de treino e registros de carga</li>
            </ul>
          </>
        }
        confirmLabel="Excluir aluno"
        cancelLabel="Manter aluno"
        destructive
        loading={deletingAluno}
        onConfirm={handleDeleteAluno}
      />
    </div>
  )
}
