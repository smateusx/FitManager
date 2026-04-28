'use client'

import { useEffect, useState } from 'react'
import {
  getPerfilById,
  listVencimentosProximos,
} from '@/lib/firestore-service'
import { getFirebaseCurrentUser } from '@/lib/firebase'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { 
  Search, 
  MessageCircle, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [loading, setLoading] = useState(true)
  const [vencimentos, setVencimentos] = useState<Vencimento[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVencimentos()
  }, [])

  async function fetchVencimentos() {
    try {
      setLoading(true)
      const currentUser = await getFirebaseCurrentUser()
      if (!currentUser) {
        setVencimentos([])
        return
      }

      const perfil = await getPerfilById(currentUser.uid)
      if (!perfil?.academia_id) {
        setVencimentos([])
        return
      }

      const data = await listVencimentosProximos(perfil.academia_id)
      setVencimentos(data || [])
    } catch (err) {
      console.error('Erro ao buscar vencimentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredVencimentos = vencimentos.filter(v => 
    v.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plano_nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendWhatsApp = (v: Vencimento) => {
    if (!v.aluno_telefone) {
      alert('Aluno sem telefone cadastrado.')
      return
    }

    const billingStatus =
      v.status_vencimento === 'EM_DIA' ? 'VENCENDO_EM_BREVE' : v.status_vencimento

    const mensagem = WhatsAppService.getBillingMessage(
      v.aluno_nome,
      v.plano_nome,
      v.data_vencimento,
      billingStatus
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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Central de Cobranças</h1>
            <p className="text-[#A6A6A6] mt-1">Gerencie renovações e envie lembretes de pagamento via WhatsApp.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#585759]" />
              <Input 
                placeholder="Buscar aluno ou plano..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-[#0D0D0D] border-[#585759]/50 text-white pl-10 w-64 h-11 rounded-xl focus-visible:ring-[#F2B705]"
              />
            </div>
            <Button 
              onClick={fetchVencimentos}
              variant="outline"
              className="border-[#585759]/50 text-white hover:bg-[#585759]/20 h-11 rounded-xl"
            >
              Atualizar
            </Button>
          </div>
        </header>

        {/* Resumo de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0D0D0D] border border-[#585759]/30 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm font-medium text-[#A6A6A6]">Já Vencidos</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {vencimentos.filter(v => v.status_vencimento === 'VENCIDO').length}
            </p>
          </div>

          <div className="bg-[#0D0D0D] border border-[#585759]/30 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#F2B705]" />
              </div>
              <span className="text-sm font-medium text-[#A6A6A6]">Vencendo em 7 dias</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {vencimentos.filter(v => v.status_vencimento === 'VENCENDO_EM_BREVE').length}
            </p>
          </div>

          <div className="bg-[#0D0D0D] border border-[#585759]/30 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-[#A6A6A6]">Total Pendente</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {vencimentos.length}
            </p>
          </div>
        </div>

        {/* Tabela de Cobrança */}
        <div className="bg-[#0D0D0D] border border-[#585759]/30 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#585759]/10 border-b border-[#585759]/20">
                <th className="px-6 py-4 text-xs font-bold text-[#A6A6A6] uppercase tracking-widest">Aluno</th>
                <th className="px-6 py-4 text-xs font-bold text-[#A6A6A6] uppercase tracking-widest">Plano</th>
                <th className="px-6 py-4 text-xs font-bold text-[#A6A6A6] uppercase tracking-widest">Vencimento</th>
                <th className="px-6 py-4 text-xs font-bold text-[#A6A6A6] uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#A6A6A6] uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredVencimentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#585759]">
                    Nenhuma pendência encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredVencimentos.map((v) => (
                  <tr key={v.matricula_id} className="border-b border-[#585759]/10 hover:bg-[#585759]/5 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-white">{v.aluno_nome}</p>
                      <p className="text-xs text-[#585759]">{v.aluno_telefone || 'Sem telefone'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm px-2 py-1 bg-[#585759]/20 rounded-md text-[#A6A6A6]">
                        {v.plano_nome}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[#585759]" />
                        {new Date(v.data_vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        v.status_vencimento === 'VENCIDO' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-[#F2B705]/20 text-[#F2B705]'
                      }`}>
                        {v.status_vencimento === 'VENCIDO' ? 'Vencido' : `${v.dias_para_vencimento} dias`}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button 
                        onClick={() => handleSendWhatsApp(v)}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl gap-2 shadow-lg shadow-emerald-500/10"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Cobrar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
