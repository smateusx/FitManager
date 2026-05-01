'use client'

import { useEffect, useState } from 'react'
import { vencimentosProximos } from '@/lib/firestore'
import { WhatsAppService } from '@/lib/whatsapp-service'
import {
  Search,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
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
  const [loading, setLoading] = useState(true)
  const [vencimentos, setVencimentos] = useState<Vencimento[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!profile?.academia_id) {
      setLoading(false)
      return
    }
    fetchVencimentos()
  }, [authLoading, profile?.academia_id])

  async function fetchVencimentos() {
    if (!profile?.academia_id) return
    try {
      setLoading(true)
      const data = await vencimentosProximos(profile.academia_id)
      setVencimentos((data as Vencimento[]) || [])
    } catch (err) {
      console.error('Erro ao buscar vencimentos:', err)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="flex h-screen items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="w-8 h-8 text-[#F2B705] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#F2B705]">Central de Cobranças</h1>
        <p className="text-[#A6A6A6] mt-1">Gerencie renovações e envie lembretes de pagamento via WhatsApp.</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#585759]" />
        <Input
          placeholder="Buscar por aluno ou plano..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#0D0D0D] border-[#585759] text-white"
        />
      </div>

      <div className="space-y-4">
        {filteredVencimentos.length === 0 ? (
          <p className="text-[#585759] text-center py-12">Nenhum vencimento próximo encontrado.</p>
        ) : (
          filteredVencimentos.map((v) => (
            <div
              key={v.matricula_id}
              className="border border-[#585759]/40 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D]/60"
            >
              <div>
                <p className="font-bold text-white">{v.aluno_nome}</p>
                <p className="text-sm text-[#A6A6A6]">{v.plano_nome}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#585759]">
                  <Calendar className="w-3 h-3" />
                  Vence em {new Date(v.data_vencimento).toLocaleDateString('pt-BR')}
                  <span className="mx-2">•</span>
                  <Clock className="w-3 h-3" />
                  {v.dias_para_vencimento} dias
                </div>
              </div>
              <div className="flex items-center gap-3">
                {v.status_vencimento === 'VENCIDO' ? (
                  <span className="text-xs font-bold uppercase text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Vencido
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Vencendo
                  </span>
                )}
                <Button
                  onClick={() => handleSendWhatsApp(v)}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
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
