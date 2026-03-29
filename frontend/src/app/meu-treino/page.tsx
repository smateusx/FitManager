'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dumbbell, ChevronDown, ChevronUp, LogOut } from 'lucide-react'

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

export default function AlunoPortalPage() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome_completo, role')
        .eq('id', session.user.id)
        .single()

      if (!perfil) { router.push('/login'); return }

      // Se for admin, redirecionar para o painel admin
      if (perfil.role === 'ADMIN' || perfil.role === 'RECEPCIONISTA') {
        router.push('/dashboard')
        return
      }

      setUserName(perfil.nome_completo || session.user.email || 'Aluno')

      // Buscar as fichas de treino do aluno
      const { data: fichasData } = await supabase
        .from('fichas_treino')
        .select('*, exercicios(*)')
        .eq('aluno_id', session.user.id)
        .order('criado_em', { ascending: false })

      setFichas((fichasData as Ficha[]) ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-[#F2B705]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[#585759]/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F2B705] rounded-lg flex items-center justify-center shadow-lg shadow-[#F2B705]/20">
            <svg className="w-5 h-5 text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">FitManager</span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-[#A6A6A6] hover:text-red-400 transition-colors text-sm">
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 relative z-10">
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
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#585759]/10 border border-[#585759]/20">
                              <div className="w-7 h-7 rounded-full bg-[#F2B705]/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[#F2B705] text-xs font-bold">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold">{ex.nome}</p>
                                <div className="flex flex-wrap gap-3 mt-2">
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
