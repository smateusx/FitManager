'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Dumbbell, UserCheck, AlertTriangle, TrendingUp, CreditCard, Clock, FileDown, FileSpreadsheet } from 'lucide-react'
import { RevenueChart } from '@/components/revenue-chart'
import { ReportsService } from '@/lib/reports-service'
import { useAuth } from '@/hooks/use-auth'

type Stats = {
  totalAlunos: number
  alunosAtivos: number
  totalTreinos: number
  semTreino: number
  receitaMensal: number
  vencimentosMes: number
}

type RecentActivity = {
  id: string
  aluno_nome: string
  plano_nome: string
  valor: number
  data: string
}

type PerfilRelation = { nome_completo: string | null } | { nome_completo: string | null }[] | null
type PlanoRelation = { nome: string | null } | { nome: string | null }[] | null

type MatriculaMes = {
  valor_pago: number | null
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO'
  data_vencimento: string
}

type MatriculaAtividade = {
  id: string
  valor_pago: number | null
  data_inicio: string
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO'
  perfis: PerfilRelation
  planos: PlanoRelation
}

function getNomeCompleto(perfis: PerfilRelation): string {
  if (Array.isArray(perfis)) return perfis[0]?.nome_completo ?? 'Aluno Desconhecido'
  return perfis?.nome_completo ?? 'Aluno Desconhecido'
}

function getNomePlano(planos: PlanoRelation): string {
  if (Array.isArray(planos)) return planos[0]?.nome ?? 'Plano Personalizado'
  return planos?.nome ?? 'Plano Personalizado'
}

export default function DashboardPage() {
  const { profile, loading: authLoading, isReceptionist } = useAuth()
  const [stats, setStats] = useState<Stats>({ 
    totalAlunos: 0, 
    alunosAtivos: 0, 
    totalTreinos: 0, 
    semTreino: 0,
    receitaMensal: 0,
    vencimentosMes: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    const loadDashboard = async () => {
      // 1. Alunos e Treinos
      const { count: totalAlunos } = await supabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ALUNO')

      const { count: totalTreinos } = await supabase
        .from('fichas_treino')
        .select('*', { count: 'exact', head: true })

      // 2. Financeiro (Mês Atual)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      
      const { data: matriculasMes } = await supabase
        .from('matriculas')
        .select('valor_pago, status, data_vencimento, data_inicio')
        .gte('data_inicio', startOfMonth)

      const receita = ((matriculasMes as MatriculaMes[] | null) || [])
        .filter(m => m.status === 'ATIVO' && m.valor_pago)
        .reduce((sum, m) => sum + Number(m.valor_pago), 0)

      const vencimentos = ((matriculasMes as MatriculaMes[] | null) || [])
        .filter(m => m.status === 'VENCIDO')
        .length

      // 3. Atividades Recentes
      const { data: recentData } = await supabase
        .from('matriculas')
        .select('id, valor_pago, data_inicio, status, perfis(nome_completo), planos(nome)')
        .order('data_inicio', { ascending: false })
        .limit(5)

      const formattedActivities = ((recentData as MatriculaAtividade[] | null) || []).map((m) => ({
        id: m.id,
        aluno_nome: getNomeCompleto(m.perfis),
        plano_nome: getNomePlano(m.planos),
        valor: Number(m.valor_pago || 0),
        data: m.data_inicio
      }))

      setStats({
        totalAlunos: totalAlunos ?? 0,
        alunosAtivos: totalAlunos ?? 0, // Simplificação por enquanto
        totalTreinos: totalTreinos ?? 0,
        semTreino: Math.max(0, (totalAlunos ?? 0) - (totalTreinos ?? 0)),
        receitaMensal: receita,
        vencimentosMes: vencimentos
      })

      setRecentActivities(formattedActivities)
      setLoading(false)
    }

    loadDashboard()
  }, [authLoading])

  const handleExportPDF = async () => {
    if (isReceptionist) return
    setIsExporting(true)
    try {
      const { data: allMatriculas } = await supabase
        .from('matriculas')
        .select('id, valor_pago, data_inicio, status, perfis(nome_completo), planos(nome)')
        .order('data_inicio', { ascending: false })

      const columns = ['Aluno', 'Plano', 'Valor', 'Data', 'Status']
      const rows = ((allMatriculas as MatriculaAtividade[] | null) || []).map((m) => [
        getNomeCompleto(m.perfis),
        getNomePlano(m.planos),
        `R$ ${Number(m.valor_pago || 0).toFixed(2)}`,
        new Date(m.data_inicio).toLocaleDateString('pt-BR'),
        m.status
      ])

      ReportsService.exportToPDF(
        columns, 
        rows, 
        'Relatório Geral de Matrículas e Faturamento',
        `fitmanager-relatorio-${new Date().toISOString().split('T')[0]}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (isReceptionist) return
    setIsExporting(true)
    try {
      const { data: allMatriculas } = await supabase
        .from('matriculas')
        .select('valor_pago, data_inicio, status, perfis(nome_completo), planos(nome)')
      
      const formattedData = ((allMatriculas as MatriculaAtividade[] | null) || []).map((m) => ({
        'Aluno': getNomeCompleto(m.perfis),
        'Plano': getNomePlano(m.planos),
        'Valor (R$)': Number(m.valor_pago || 0),
        'Data': new Date(m.data_inicio).toLocaleDateString('pt-BR'),
        'Status': m.status
      }))

      ReportsService.exportToExcel(
        formattedData, 
        `fitmanager-faturamento-${new Date().toISOString().split('T')[0]}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const cards = [
    {
      label: 'Alunos Totais',
      value: stats.totalAlunos,
      icon: <Users className="w-5 h-5" />,
      color: 'text-white',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: isReceptionist ? 'Faturamento (Mês)' : 'Receita (Mês)',
      value: `R$ ${stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-[#F2B705]',
      bg: 'bg-[#F2B705]/10',
      border: 'border-[#F2B705]/20'
    },
    {
      label: 'Fichas de Treino',
      value: stats.totalTreinos,
      icon: <Dumbbell className="w-5 h-5" />,
      color: 'text-white',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    {
      label: 'Pendências',
      value: stats.vencimentosMes,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="pb-8 border-b border-[#585759]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Painel Administrativo</h1>
            <p className="text-[#A6A6A6] mt-1">
              Bem-vindo de volta, <span className="text-white font-medium">{profile?.nome_completo || 'Usuário'}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isReceptionist && (
              <>
                <button 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </>
            )}
            <button 
              onClick={() => router.push('/planos')}
              className="px-4 py-2.5 bg-[#F2B705] border border-[#F2B705] rounded-xl text-[#0D0D0D] text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Financeiro
            </button>
          </div>
        </header>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card, i) => (
                <div key={i} className={`bg-[#0D0D0D] border ${card.border} rounded-2xl p-6 shadow-xl flex items-center gap-4 hover:translate-y-[-4px] transition-all duration-300`}>
                  <div className={`${card.bg} p-3 rounded-xl shrink-0`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-[#A6A6A6] text-[10px] font-bold uppercase tracking-widest">{card.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Gráfico de Faturamento - Oculto para Recepcionistas conforme plano */}
              {!isReceptionist ? (
                <div className="lg:col-span-2 bg-[#0D0D0D] border border-[#585759]/30 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-white font-bold text-lg">Desempenho Financeiro</h2>
                      <p className="text-[#A6A6A6] text-xs">Faturamento mensal consolidado (R$)</p>
                    </div>
                    <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-[#F2B705]" />
                    </div>
                  </div>
                  <RevenueChart />
                </div>
              ) : (
                <div className="lg:col-span-2 bg-[#0D0D0D] border border-[#585759]/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center p-12">
                  <div className="p-4 bg-[#585759]/10 rounded-full mb-4">
                    <TrendingUp className="w-10 h-10 text-[#585759]" />
                  </div>
                  <h2 className="text-white font-bold text-xl mb-2">Relatórios Consolidados</h2>
                  <p className="text-[#A6A6A6] max-w-sm">
                    Gráficos de desempenho histórico estão restritos ao administrador da unidade.
                  </p>
                </div>
              )}

              {/* Atividades Recentes */}
              <div className="bg-[#0D0D0D] border border-[#585759]/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-bold text-lg">Atividade Recente</h2>
                  <Clock className="w-5 h-5 text-[#A6A6A6]" />
                </div>
                
                <div className="space-y-6">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#585759] text-sm italic">Nenhuma atividade recente encontrada.</p>
                    </div>
                  ) : (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-[#585759]/20 flex items-center justify-center shrink-0 border border-[#585759]/20 group-hover:border-[#F2B705]/50 transition-colors">
                          <UserCheck className="w-5 h-5 text-[#A6A6A6] group-hover:text-[#F2B705]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate leading-tight">
                            {activity.aluno_nome}
                          </p>
                          <p className="text-[#A6A6A6] text-[11px] mt-0.5 truncate">
                            Matrícula: {activity.plano_nome}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                             <span className="text-[10px] text-[#585759]">
                              {new Date(activity.data).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-emerald-400 text-xs font-bold font-mono">
                              + R$ {activity.valor.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <button 
                  onClick={() => router.push('/planos')}
                  className="w-full mt-8 py-3 border border-dashed border-[#585759]/50 rounded-xl text-[#A6A6A6] text-xs font-medium hover:border-[#F2B705]/50 hover:text-white transition-all"
                >
                  Ver todo o financeiro
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
