'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Dumbbell, UserCheck, AlertTriangle } from 'lucide-react'

type Stats = {
  totalAlunos: number
  alunosAtivos: number
  totalTreinos: number
  semTreino: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({ totalAlunos: 0, alunosAtivos: 0, totalTreinos: 0, semTreino: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      // Count total students (RLS already filters by academia_id)
      const { count: totalAlunos } = await supabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ALUNO')

      // Count students with at least one workout plan
      const { count: totalTreinos } = await supabase
        .from('fichas_treino')
        .select('*', { count: 'exact', head: true })

      const total = totalAlunos ?? 0
      const treinos = totalTreinos ?? 0
      const semTreino = Math.max(0, total - treinos)

      setStats({
        totalAlunos: total,
        alunosAtivos: total,
        totalTreinos: treinos,
        semTreino
      })

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  const cards = [
    {
      label: 'Total de Alunos',
      value: stats.totalAlunos,
      icon: <Users className="w-6 h-6" />,
      color: 'text-white',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: 'Alunos Ativos',
      value: stats.alunosAtivos,
      icon: <UserCheck className="w-6 h-6" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      label: 'Fichas de Treino',
      value: stats.totalTreinos,
      icon: <Dumbbell className="w-6 h-6" />,
      color: 'text-[#F2B705]',
      bg: 'bg-[#F2B705]/10',
      border: 'border-[#F2B705]/20'
    },
    {
      label: 'Sem Ficha de Treino',
      value: stats.semTreino,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="pb-8 border-b border-[#585759]/30">
          <h1 className="text-3xl font-bold text-[#F2B705]">Painel Administrativo</h1>
          <p className="text-[#A6A6A6] mt-1">
            Bem-vindo de volta, <span className="text-white font-medium">{user?.user_metadata?.nome_completo || 'Administrador'}</span>.
          </p>
        </header>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card, i) => (
                <div key={i} className={`bg-[#0D0D0D] border ${card.border} rounded-xl p-6 shadow-xl shadow-[#0D0D0D] flex items-start gap-4 hover:scale-[1.02] transition-transform duration-200`}>
                  <div className={`${card.bg} p-3 rounded-xl shrink-0`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-[#A6A6A6] text-xs font-medium uppercase tracking-wider">{card.label}</p>
                    <p className={`text-4xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0D0D0D] border border-[#585759]/50 rounded-xl p-6">
                <h2 className="text-white font-semibold text-lg mb-1">Últimos Alunos Cadastrados</h2>
                <p className="text-[#585759] text-sm">Vá para a aba <span className="text-[#F2B705]">Alunos</span> para gerenciar.</p>
                <div className="mt-6 flex items-center justify-center h-24 text-[#585759] text-sm border border-dashed border-[#585759]/30 rounded-lg">
                  Lista de alunos recentes — em breve
                </div>
              </div>
              <div className="bg-[#0D0D0D] border border-[#585759]/50 rounded-xl p-6">
                <h2 className="text-white font-semibold text-lg mb-1">Fichas Recentes</h2>
                <p className="text-[#585759] text-sm">Vá para a aba <span className="text-[#F2B705]">Treinos</span> para gerenciar.</p>
                <div className="mt-6 flex items-center justify-center h-24 text-[#585759] text-sm border border-dashed border-[#585759]/30 rounded-lg">
                  Fichas de treino recentes — em breve
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
