'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import {
  getPerfil,
  insertRegistroCarga,
  listFichasByAluno,
  listMatriculasByAluno,
  getAcademia,
} from '@/lib/firestore'
import { normalizeWhatsAppDigits, whatsAppChatUrl } from '@/lib/whatsapp-contact'
import { 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  TrendingUp, 
  CreditCard, 
  Info, 
  MessageSquare, 
  Calendar, 
  Clock 
} from 'lucide-react'
import { EvolutionChart } from '@/components/evolution-chart'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile-avatar'
import { TreinosPreProntosAluno } from '@/components/treinos-pre-prontos-aluno'
import { TreinoContextBanner } from '@/components/treino-context-banner'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'

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
  objetivo: string
  criado_em: string
  exercicios: Exercicio[]
}

export default function MeuTreinoPage() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [showingChartId, setShowingChartId] = useState<string | null>(null)
  const [cargaValue, setCargaValue] = useState('')
  const [repsValue, setRepsValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'treinos' | 'financeiro'>('treinos')
  const [matriculas, setMatriculas] = useState<
    Awaited<ReturnType<typeof listMatriculasByAluno>>
  >([])
  const [academiaWaHref, setAcademiaWaHref] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(
    null
  )

  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const u = getFirebaseAuth().currentUser

      if (!u) {
        router.push('/login/aluno')
        return
      }

      if (!u.emailVerified) {
        router.push('/verificar-email')
        return
      }

      const perfil = await getPerfil(u.uid)
      if (!perfil?.cpf) {
        router.push('/completar-cadastro')
        return
      }

      if (perfil) {
        setUserName(perfil.nome_completo || 'Aluno')
        setUserId(u.uid)
        if (perfil.academia_id) {
          const ac = await getAcademia(perfil.academia_id)
          const raw = ac?.whatsapp_contato
          if (raw?.replace(/\D/g, '')) {
            setAcademiaWaHref(whatsAppChatUrl(normalizeWhatsAppDigits(raw)))
          } else {
            setAcademiaWaHref(null)
          }
        } else {
          setAcademiaWaHref(null)
        }
      }

      const fichasData = await listFichasByAluno(u.uid)
      setFichas((fichasData as Ficha[]) ?? [])

      const matriculasData = await listMatriculasByAluno(u.uid)
      setMatriculas(matriculasData || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await signOut(getFirebaseAuth())
    router.push('/login/aluno')
  }

  const handleSaveCarga = async (ex: Exercicio) => {
    if (!userId || !cargaValue || !repsValue) return
    
    setIsSaving(true)
    try {
      await insertRegistroCarga({
        aluno_id: userId,
        exercicio_id: ex.id,
        carga: cargaValue,
        repeticoes: parseInt(repsValue),
        data_registro: new Date().toISOString(),
      })
      
      setRegisteringId(null)
      setCargaValue('')
      setRepsValue('')
      setShowingChartId(ex.id)
      setFeedback({ variant: 'success', message: 'Carga registrada com sucesso.' })
    } catch (err) {
      console.error('Erro ao salvar carga:', err)
      setFeedback({
        variant: 'error',
        message: 'Não foi possível salvar o registro. Verifique os valores e tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0D0D0D] py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F2B705] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-[#0D0D0D] text-white">
      {/* Glossy Header Background */}
      <div className="fixed top-0 inset-x-0 h-40 bg-gradient-to-b from-[#F2B705]/5 to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-[#585759]/20">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2B705]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2B705]">
              <Dumbbell className="h-5 w-5 text-[#0D0D0D]" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">FitManager</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => router.push('/meu-perfil')}
              className="group flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-[#585759]/30 hover:bg-[#585759]/20 sm:gap-3 sm:px-3"
            >
              <ProfileAvatar name={userName} sizeClass="h-8 w-8 text-[10px]" />
              <span className="text-sm font-medium text-[#A6A6A6] group-hover:text-white truncate hidden sm:inline max-w-[8rem]">
                {userName.split(' ')[0]}
              </span>
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 text-[#A6A6A6] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-[#A6A6A6] text-sm uppercase tracking-widest font-semibold mb-1">Portal do Aluno</p>
          <h1 className="text-3xl font-bold text-white">Olá, {userName.split(' ')[0]}!</h1>
          <p className="text-[#A6A6A6] mt-1">Aqui estão suas informações e treinos.</p>
        </div>

        {academiaWaHref ? (
          <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 sm:px-5">
            <p className="text-sm text-[#A6A6A6]">
              Dúvidas sobre treino ou sobre a academia? Fale com a equipe pelo WhatsApp cadastrado pela academia.
            </p>
            <a
              href={academiaWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#128C7E]"
            >
              Abrir WhatsApp da academia
            </a>
          </div>
        ) : null}

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#585759]/10 rounded-2xl mb-8 border border-[#585759]/20">
          <button
            onClick={() => setActiveTab('treinos')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
              activeTab === 'treinos' 
              ? 'bg-[#F2B705] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/10' 
              : 'text-[#A6A6A6] hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-sm">Treinos</span>
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
              activeTab === 'financeiro' 
              ? 'bg-[#F2B705] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/10' 
              : 'text-[#A6A6A6] hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Matrícula</span>
          </button>
        </div>

        {activeTab === 'treinos' ? (
          <>
            {feedback ? (
              <InlineFeedback
                variant={feedback.variant}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
                autoDismissMs={feedback.variant === 'success' ? 4000 : undefined}
                className="mb-6"
              />
            ) : null}

            <TreinosPreProntosAluno />

            {fichas.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#585759]/40 py-16 text-center">
                <div className="rounded-2xl bg-[#F2B705]/10 p-5">
                  <Dumbbell className="h-10 w-10 text-[#F2B705]" />
                </div>
                <p className="text-lg font-semibold text-white">Nenhuma ficha oficial ainda</p>
                <p className="max-w-xs text-sm text-[#A6A6A6]">
                  Enquanto isso, use o treino sugerido acima. Quando a academia cadastrar sua ficha, ela aparecerá aqui
                  com registro de carga e evolução.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-10 space-y-4">
                  <TreinoContextBanner variant="oficial" />
                  {fichas.map((ficha) => {
                  const isExpanded = expandedId === ficha.id
                  const exs = (ficha.exercicios ?? []).sort((a, b) => a.ordem - b.ordem)
                  return (
                    <div key={ficha.id} className="border border-[#585759]/50 rounded-xl overflow-hidden bg-[#0D0D0D]/80 hover:border-[#585759] transition-colors">
                      <button
                        className="w-full flex items-center justify-between p-5 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : ficha.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-[#F2B705]/10 rounded-lg shrink-0">
                            <Dumbbell className="w-5 h-5 text-[#F2B705]" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{ficha.nome}</p>
                            {ficha.objetivo && (
                              <p className="text-[#A6A6A6] text-sm mt-0.5">{ficha.objetivo}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#585759] hidden sm:block">
                            {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                          {isExpanded
                            ? <ChevronUp className="w-5 h-5 text-[#A6A6A6]" />
                            : <ChevronDown className="w-5 h-5 text-[#A6A6A6]" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#585759]/30 p-5">
                          {exs.length === 0 ? (
                            <p className="text-[#585759] text-sm text-center py-4">Nenhum exercício nesta ficha.</p>
                          ) : (
                            <div className="space-y-3">
                              {exs.map((ex, i) => (
                                <div key={ex.id} className="p-4 rounded-xl bg-[#585759]/10 border border-[#585759]/20">
                                  <div className="flex items-start gap-4">
                                    <div className="w-7 h-7 rounded-full bg-[#F2B705]/20 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-[#F2B705] text-xs font-bold">{i + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-white font-semibold flex-1 truncate">{ex.nome}</p>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => setShowingChartId(showingChartId === ex.id ? null : ex.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${showingChartId === ex.id ? 'bg-[#F2B705] text-[#0D0D0D]' : 'bg-[#585759]/30 text-[#A6A6A6] hover:text-[#F2B705]'}`}
                                          >
                                            <TrendingUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              setRegisteringId(registeringId === ex.id ? null : ex.id)
                                              setCargaValue(ex.carga?.replace('kg', '').trim() || '')
                                              setRepsValue(ex.repeticoes?.split('-')[0] || '')
                                            }}
                                            className="text-[10px] font-bold uppercase tracking-tight px-2 py-1 rounded bg-[#F2B705] text-[#0D0D0D] hover:bg-[#F2B705]/80 transition-colors"
                                          >
                                            {registeringId === ex.id ? 'Cancelar' : 'Registrar'}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs px-2 py-1 rounded-md bg-[#585759]/30 text-[#A6A6A6]">
                                          {ex.series}x séries
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-md bg-[#585759]/30 text-[#A6A6A6]">
                                          {ex.repeticoes} reps
                                        </span>
                                        {ex.carga && (
                                          <span className="text-xs px-2 py-1 rounded-md bg-[#F2B705]/10 text-[#F2B705]">
                                            {ex.carga}
                                          </span>
                                        )}
                                        <span className="text-xs px-2 py-1 rounded-md bg-[#585759]/30 text-[#A6A6A6]">
                                          {ex.descanso} descanso
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Gráfico de Evolução */}
                                  {showingChartId === ex.id && userId && (
                                    <div className="mt-4 animate-in zoom-in-95 duration-200">
                                      <EvolutionChart exercicioId={ex.id} alunoId={userId} />
                                    </div>
                                  )}

                                  {/* Form Registro de Carga */}
                                  {registeringId === ex.id && (
                                    <div className="mt-4 pt-4 border-t border-[#585759]/20 animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-[#A6A6A6] uppercase font-bold mb-1 block">Peso (kg)</label>
                                          <input 
                                            type="text" 
                                            value={cargaValue}
                                            onChange={(e) => setCargaValue(e.target.value)}
                                            placeholder="Ex: 50"
                                            className="w-full bg-[#0D0D0D] border border-[#585759]/50 rounded-lg px-3 py-2 text-sm focus:border-[#F2B705] outline-none transition-colors"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-[#A6A6A6] uppercase font-bold mb-1 block">Reps</label>
                                          <input 
                                            type="number" 
                                            value={repsValue}
                                            onChange={(e) => setRepsValue(e.target.value)}
                                            placeholder="Ex: 12"
                                            className="w-full bg-[#0D0D0D] border border-[#585759]/50 rounded-lg px-3 py-2 text-sm focus:border-[#F2B705] outline-none transition-colors"
                                          />
                                        </div>
                                      </div>
                                      <button 
                                        disabled={isSaving || !cargaValue || !repsValue}
                                        onClick={() => handleSaveCarga(ex)}
                                        className="w-full mt-3 bg-[#F2B705] text-[#0D0D0D] font-bold py-2 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50"
                                      >
                                        {isSaving ? 'Salvando...' : 'Confirmar Registro'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {matriculas.length > 0 ? (
              <>
                {/* Status Card Principal */}
                <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
                  matriculas[0].status === 'ATIVO' && new Date(matriculas[0].data_vencimento) > new Date()
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        matriculas[0].status === 'ATIVO' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Plano Atual</span>
                    </div>
                    
                    <h2 className="text-4xl font-black mb-1">{matriculas[0].planos?.nome}</h2>
                    <p className="text-2xl font-bold opacity-80">
                      R$ {matriculas[0].planos?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Próximo Vencimento</p>
                        <p className="font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(matriculas[0].data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Status</p>
                        <p className="font-bold uppercase tracking-tighter">
                          {matriculas[0].status === 'ATIVO' && new Date(matriculas[0].data_vencimento) > new Date() ? 'REGULAR' : 'PENDENTE'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Histórico de Matrículas */}
                <section>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#F2B705]" />
                    Histórico de Matrículas
                  </h3>
                  <div className="bg-[#585759]/5 border border-[#585759]/20 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#585759]/10 text-[#A6A6A6] font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Plano</th>
                          <th className="px-6 py-4">Vencimento</th>
                          <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#585759]/10">
                        {matriculas.map((m) => (
                          <tr key={m.id} className="hover:bg-[#585759]/5 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-white">{m.planos?.nome}</p>
                              <p className="text-[10px] text-[#585759]">Ativado em {new Date(m.data_inicio).toLocaleDateString('pt-BR')}</p>
                            </td>
                            <td className="px-6 py-4 text-[#A6A6A6]">
                              {new Date(m.data_vencimento).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                m.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-[#585759]/40 rounded-3xl">
                <div className="p-5 bg-red-500/10 rounded-2xl">
                  <Info className="w-10 h-10 text-red-400" />
                </div>
                <p className="text-white font-semibold text-lg">Sem matrícula ativa</p>
                <p className="text-[#A6A6A6] text-sm max-w-xs">
                  Você ainda não possui um plano vinculado. Procure a recepção para ativar sua matrícula.
                </p>
              </div>
            )}

            {/* Suporte */}
            <div className="mt-8 p-6 bg-[#F2B705]/5 border border-[#F2B705]/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-bold text-white">Dúvidas sobre pagamentos?</p>
                <p className="text-sm text-[#A6A6A6]">Fale diretamente com nossa equipe de suporte.</p>
              </div>
              <Button 
                onClick={() => window.open('https://wa.me/5571999999999', '_blank')}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl gap-2 h-11 w-full sm:w-auto"
              >
                <MessageSquare className="w-4 h-4" />
                Chamar no WhatsApp
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
