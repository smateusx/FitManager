'use client'

import { useEffect, useState, useCallback } from 'react'
import { vencimentosProximos, matriculasTodas } from '@/lib/firestore'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { ReportsService } from '@/lib/reports-service'
import {
  Search,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

type Vencimento = {
  matricula_id: string
  aluno_nome: string
  aluno_telefone: string
  plano_nome: string
  data_vencimento: string
  status_vencimento: 'VENCIDO' | 'VENCENDO_EM_BREVE' | 'EM_DIA'
  dias_para_vencimento: number
}

export default function CobrancasPage() {
  const { profile, loading: authLoading, isReceptionist } = useAuth()
  const academiaId = profile?.academia_id ?? null
  const [loading, setLoading] = useState(true)
  const [vencimentos, setVencimentos] = useState<Vencimento[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const fetchVencimentos = useCallback(async () => {
    if (!academiaId) return
    try {
      setLoading(true)
      const data = await vencimentosProximos(academiaId)
      setVencimentos((data as Vencimento[]) || [])
    } catch (err) {
      console.error('Erro ao buscar vencimentos:', err)
    } finally {
      setLoading(false)
    }
  }, [academiaId])

  useEffect(() => {
    if (authLoading) return
    if (!academiaId) {
      setLoading(false)
      return
    }
    queueMicrotask(() => {
      void fetchVencimentos()
    })
  }, [authLoading, academiaId, fetchVencimentos])

  const filteredVencimentos = vencimentos.filter(
    (v) =>
      v.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plano_nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendWhatsApp = (v: Vencimento) => {
    if (!v.aluno_telefone) {
      alert('Aluno sem telefone cadastrado.')
      return
    }
    const mensagem = WhatsAppService.getBillingMessage(
      v.aluno_nome,
      v.plano_nome,
      v.data_vencimento,
      v.status_vencimento as 'VENCIDO' | 'VENCENDO_EM_BREVE'
    )
    const link = WhatsAppService.getLink(v.aluno_telefone, mensagem)
    window.open(link, '_blank')
  }

  const handleExportPDF = async () => {
    if (isReceptionist || !academiaId) return
    setIsExporting(true)
    try {
      const allMatriculas = await matriculasTodas(academiaId)
      const columns = ['Aluno', 'Plano', 'Valor', 'Data', 'Status']
      const rows = (allMatriculas ?? []).map((m: Record<string, unknown>) => {
        const perfis = m.perfis as { nome_completo?: string } | undefined
        const planos = m.planos as { nome?: string } | undefined
        return [
          perfis?.nome_completo || 'Não informado',
          planos?.nome || 'Não informado',
          `R$ ${Number(m.valor_pago ?? 0).toFixed(2)}`,
          new Date(String(m.criado_em ?? '')).toLocaleDateString('pt-BR'),
          String(m.status ?? ''),
        ]
      })
      ReportsService.exportToPDF(
        columns,
        rows,
        'Relatório de matrículas',
        `fitmanager-cobrancas-${new Date().toISOString().split('T')[0]}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (isReceptionist || !academiaId) return
    setIsExporting(true)
    try {
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
      ReportsService.exportToExcel(
        formattedData,
        `fitmanager-cobrancas-${new Date().toISOString().split('T')[0]}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0D0D0D] py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2B705]" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-0 max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Central de Cobranças</h1>
          <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">
            Renovações, lembretes por WhatsApp e exportação de matrículas.
          </p>
        </div>
        {!isReceptionist && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => void handleExportPDF()}
              className="h-9 border-[#585759]/40 bg-transparent text-[#A6A6A6] hover:bg-[#585759]/15 hover:text-white"
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => void handleExportExcel()}
              className="h-9 border-[#585759]/40 bg-transparent text-[#A6A6A6] hover:bg-[#585759]/15 hover:text-white"
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              Excel
            </Button>
          </div>
        )}
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#585759]" />
        <Input
          placeholder="Buscar por aluno ou plano..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-[#585759] bg-[#0D0D0D] pl-10 text-white"
        />
      </div>

      <div className="space-y-4">
        {filteredVencimentos.length === 0 ? (
          <p className="py-12 text-center text-[#585759]">Nenhum vencimento próximo encontrado.</p>
        ) : (
          filteredVencimentos.map((v) => (
            <div
              key={v.matricula_id}
              className="flex flex-col gap-4 rounded-xl border border-[#585759]/40 bg-[#0D0D0D]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white">{v.aluno_nome}</p>
                <p className="text-sm text-[#A6A6A6]">{v.plano_nome}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#585759]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    Vence em {new Date(v.data_vencimento).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="hidden sm:inline" aria-hidden>
                    •
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {v.dias_para_vencimento} dias
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                {v.status_vencimento === 'VENCIDO' ? (
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> Vencido
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-amber-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Vencendo
                  </span>
                )}
                <Button
                  type="button"
                  onClick={() => handleSendWhatsApp(v)}
                  className="bg-[#25D366] text-white hover:bg-[#128C7E]"
                >
                  <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
                  WhatsApp
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
