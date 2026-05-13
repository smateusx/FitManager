'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  countFichasAcademia,
  countPerfisRole,
  matriculasCriadasDesde,
  matriculasRecentes,
  matriculasTodas,
} from '@/lib/firestore'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { RevenueChart } from '@/components/revenue-chart'
import { ReportsService } from '@/lib/reports-service'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

type Stats = {
  totalAlunos: number
  totalTreinos: number
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

type MatriculaMesRow = {
  status?: string
  valor_pago?: unknown
}

export default function DashboardPage() {
  const { profile, loading: authLoading, isReceptionist } = useAuth()
  const academiaId = profile?.academia_id
  const [stats, setStats] = useState<Stats>({
    totalAlunos: 0,
    totalTreinos: 0,
    receitaMensal: 0,
    vencimentosMes: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading || !academiaId) {
      if (!authLoading && !academiaId) setLoading(false)
      return
    }

    const loadDashboard = async () => {
      setLoadError(null)
      try {
        const totalAlunos = await countPerfisRole(academiaId, 'ALUNO')
        const totalTreinos = await countFichasAcademia(academiaId)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const matriculasMes = (await matriculasCriadasDesde(academiaId, startOfMonth)) as MatriculaMesRow[]

        const receita = matriculasMes
          .filter((m) => m.status === 'ATIVO' && m.valor_pago != null)
          .reduce((sum, m) => sum + Number(m.valor_pago), 0)

        const vencimentos = matriculasMes.filter((m) => m.status === 'VENCIDO').length

        const recentData = await matriculasRecentes(academiaId, 5)
        const formattedActivities = (recentData ?? []).map((m: Record<string, unknown>) => {
          const perfis = m.perfis as { nome_completo?: string } | undefined
          const planos = m.planos as { nome?: string } | undefined
          return {
            id: String(m.id ?? ''),
            aluno_nome: perfis?.nome_completo || 'Aluno',
            plano_nome: planos?.nome || 'Plano',
            valor: Number(m.valor_pago ?? 0),
            data: String(m.criado_em ?? ''),
          }
        })

        setStats({
          totalAlunos,
          totalTreinos,
          receitaMensal: receita,
          vencimentosMes: vencimentos,
        })

        setRecentActivities(formattedActivities)
      } catch (e) {
        console.error('Erro ao carregar dashboard:', e)
        const msg =
          e instanceof Error ? e.message : 'Não foi possível carregar os dados. Veja a consola (F12).'
        setLoadError(msg)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [authLoading, academiaId])

  const handleExportPDF = async () => {
    if (isReceptionist) return
    setIsExporting(true)
    try {
      if (!academiaId) return
      const allMatriculas = await matriculasTodas(academiaId)

      const columns = ['Aluno', 'Plano', 'Valor', 'Data', 'Status']
      const rows = (allMatriculas ?? []).map((m: Record<string, unknown>) => {
        const perfis = m.perfis as { nome_completo?: string } | undefined
        const planos = m.planos as { nome?: string } | undefined
        return [
          perfis?.nome_completo || '—',
          planos?.nome || '—',
          `R$ ${Number(m.valor_pago ?? 0).toFixed(2)}`,
          new Date(String(m.criado_em ?? '')).toLocaleDateString('pt-BR'),
          String(m.status ?? ''),
        ]
      })

      ReportsService.exportToPDF(
        columns,
        rows,
        'Relatório de matrículas',
        `fitmanager-${new Date().toISOString().split('T')[0]}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (isReceptionist) return
    setIsExporting(true)
    try {
      if (!academiaId) return
      const allMatriculas = await matriculasTodas(academiaId)

      const formattedData = (allMatriculas ?? []).map((m: Record<string, unknown>) => {
        const perfis = m.perfis as { nome_completo?: string } | undefined
        const planos = m.planos as { nome?: string } | undefined
        return {
          Aluno: perfis?.nome_completo,
          Plano: planos?.nome,
          'Valor (R$)': Number(m.valor_pago ?? 0),
          Data: new Date(String(m.criado_em ?? '')).toLocaleDateString('pt-BR'),
          Status: m.status,
        }
      })

      ReportsService.exportToExcel(formattedData, `fitmanager-${new Date().toISOString().split('T')[0]}`)
    } finally {
      setIsExporting(false)
    }
  }

  const statItems = [
    { label: 'Alunos', value: String(stats.totalAlunos) },
    {
      label: isReceptionist ? 'Faturamento (mês)' : 'Receita (mês)',
      value: `R$ ${stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      accent: true,
    },
    { label: 'Fichas', value: String(stats.totalTreinos) },
    { label: 'Vencidos (mês)', value: String(stats.vencimentosMes) },
  ]

  return (
    <div className="min-h-0 p-5 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#585759]">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Olá, {profile?.nome_completo?.split(' ')[0] || 'equipe'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isReceptionist && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportPDF}
                  className="h-9 border-[#585759]/40 bg-transparent text-[#A6A6A6] hover:bg-[#585759]/15 hover:text-white"
                >
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportExcel}
                  className="h-9 border-[#585759]/40 bg-transparent text-[#A6A6A6] hover:bg-[#585759]/15 hover:text-white"
                >
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                  Excel
                </Button>
              </>
            )}
            <Button
              type="button"
              size="sm"
              className="h-9 bg-[#F2B705] px-4 font-semibold text-[#0D0D0D] hover:bg-[#BF9004]"
              onClick={() => router.push('/planos')}
            >
              Financeiro
            </Button>
          </div>
        </div>

        {loadError && !loading && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#585759]/50 border-t-[#F2B705]" />
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-[#585759]/25 bg-[#0D0D0D]/60">
              <div className="grid grid-cols-2 divide-x divide-[#585759]/20 md:grid-cols-4">
                {statItems.map((item) => (
                  <div key={item.label} className="px-4 py-5 sm:px-5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#585759]">{item.label}</p>
                    <p
                      className={`mt-2 text-lg font-semibold tabular-nums sm:text-xl ${item.accent ? 'text-[#F2B705]' : 'text-white'}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
              {!isReceptionist ? (
                <section className="rounded-xl border border-[#585759]/25 bg-[#0D0D0D]/60 p-5 lg:col-span-3">
                  <h2 className="text-sm font-medium text-[#A6A6A6]">Faturamento mensal</h2>
                  <div className="mt-4 min-h-[220px] w-full min-w-0 overflow-x-auto">
                    <div className="min-w-[280px]">
                      <RevenueChart academiaId={academiaId || ''} />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="flex min-h-[220px] flex-col justify-center rounded-xl border border-[#585759]/25 bg-[#0D0D0D]/60 px-5 py-8 text-center lg:col-span-3">
                  <p className="text-sm text-[#585759]">Gráfico financeiro disponível apenas para administradores.</p>
                </section>
              )}

              <section className="rounded-xl border border-[#585759]/25 bg-[#0D0D0D]/60 p-5 lg:col-span-2">
                <h2 className="text-sm font-medium text-[#A6A6A6]">Últimas matrículas</h2>
                <ul className="mt-4 divide-y divide-[#585759]/15">
                  {recentActivities.length === 0 ? (
                    <li className="py-8 text-center text-sm text-[#585759]">Nenhuma matrícula recente.</li>
                  ) : (
                    recentActivities.map((a) => (
                      <li key={a.id} className="flex flex-col gap-1 py-3 first:pt-0">
                        <span className="truncate text-sm font-medium text-white">{a.aluno_nome}</span>
                        <span className="truncate text-xs text-[#585759]">{a.plano_nome}</span>
                        <span className="flex justify-between text-xs text-[#585759]">
                          <span>{new Date(a.data).toLocaleDateString('pt-BR')}</span>
                          <span className="tabular-nums text-[#A6A6A6]">
                            R$ {a.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  type="button"
                  onClick={() => router.push('/planos')}
                  className="mt-4 w-full rounded-lg py-2 text-center text-xs font-medium text-[#585759] transition-colors hover:text-[#F2B705]"
                >
                  Ver planos e matrículas
                </button>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
