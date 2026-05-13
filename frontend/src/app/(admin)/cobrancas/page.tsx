'use client'

import { useEffect, useState, useCallback } from 'react'
import { vencimentosProximos } from '@/lib/firestore'
import { WhatsAppService } from '@/lib/whatsapp-service'
import {
  Search,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
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
  const { profile, loading: authLoading } = useAuth()
  const academiaId = profile?.academia_id ?? null
  const [loading, setLoading] = useState(true)
  const [vencimentos, setVencimentos] = useState<Vencimento[]>([])
  const [searchTerm, setSearchTerm] = useState('')

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0D0D0D] py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2B705]" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-0 max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Central de Cobranças</h1>
        <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">
          Gerencie renovações e envie lembretes de pagamento via WhatsApp.
        </p>
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
