'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dumbbell, ChevronDown, ChevronUp, LogOut, TrendingUp, User } from 'lucide-react'
import { EvolutionChart } from '@/components/evolution-chart'

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

export default function AlunoPortalPage() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // States for load registration
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [showingChartId, setShowingChartId] = useState<string | null>(null)
  const [cargaValue, setCargaValue] = useState('')
  const [repsValue, setRepsValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [perfilData, setPerfilData] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome_completo, role, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (!perfil) { router.push('/login'); return }

      // Se for admin, redirecionar para o painel admin
      if (perfil.role === 'ADMIN' || perfil.role === 'RECEPCIONISTA') {
        router.push('/dashboard')
        return
      }

      setUserName(perfil.nome_completo || session.user.email || 'Aluno')
      setUserId(session.user.id)
      setPerfilData(perfil)

      // Buscar as fichas de treino do aluno
      const { data: fichasData } = await supabase
        .from('fichas_treino')
        .select('*, exercicios(*)')
        .eq('aluno_id', session.user.id)
        .order('criado_em', { ascending: false })

      setFichas((fichasData as any) ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSaveCarga = async (ex: Exercicio) => {
    if (!cargaValue || !repsValue) return
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const { error } = await supabase
        .from('registros_carga')
        .insert({
          aluno_id: session.user.id,
          exercicio_id: ex.id,
          carga: parseFloat(cargaValue.replace(',', '.')),
          repeticoes: parseInt(repsValue),
          data_registro: new Date().toISOString()
        })

      if (error) throw error

      setRegisteringId(null)
      setCargaValue('')
      setRepsValue('')
      // TODO: Add success toast
    } catch (err) {
      console.error('Erro ao salvar carga:', err)
      alert('Erro ao salvar registro de carga.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Student Header */}
      <nav className="sticky top-0 z-30 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-[#585759]/30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2B705] rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#0D0D0D]" />
            </div>
            <span className="font-black text-lg tracking-tighter hidden sm:inline">FitManager</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/meu-perfil')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#585759]/20 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#585759]/50 group-hover:border-[#F2B705]/50 flex items-center justify-center bg-[#585759]/10">
                {perfilData?.avatar_url ? (
                  <img src={perfilData.avatar_url} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-[#A6A6A6] group-hover:text-[#F2B705]" />
                )}
              </div>
              <span className="text-sm font-medium text-[#A6A6A6] group-hover:text-white hidden sm:inline">{userName.split(' ')[0]}</span>
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
      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-[#A6A6A6] text-sm uppercase tracking-widest font-semibold mb-1">Portal do Aluno</p>
          <h1 className="text-3xl font-bold text-white">Olá, {userName.split(' ')[0]}! 👋</h1>
          <p className="text-[#A6A6A6] mt-1">Aqui estão suas fichas de treino.</p>
        </div>

        {/* Fichas */}
        {fichas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-[#585759]/40 rounded-2xl">
            <div className="p-5 bg-[#F2B705]/10 rounded-2xl">
              <Dumbbell className="w-10 h-10 text-[#F2B705]" />
            </div>
            <p className="text-white font-semibold text-lg">Nenhuma ficha ainda</p>
            <p className="text-[#A6A6A6] text-sm max-w-xs">
              Aguarde seu professor montar sua ficha de treino personalizada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
        )}
      </main>
    </div>
  )
}
