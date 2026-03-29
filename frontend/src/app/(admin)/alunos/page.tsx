'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from '@/lib/supabase'
import { Copy, X, CheckCircle2 } from 'lucide-react'

type Aluno = {
  id: string
  nome_completo: string
  telefone: string | null
  created_at: string
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAlunos()
  }, [])

  const fetchAlunos = async () => {
    setLoading(true)
    
    // 1. Get current admin session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    // 2. Get academia_id of the admin to build the invite link
    const { data: adminProfile } = await supabase
      .from('perfis')
      .select('academia_id')
      .eq('id', session.user.id)
      .single()
      
    if (adminProfile) {
      setAcademiaId(adminProfile.academia_id)
    }

    // 3. Get all students (RLS automatically filters by your academia)
    const { data: alunosData } = await supabase
      .from('perfis')
      .select('*')
      .eq('role', 'ALUNO')
      .order('created_at', { ascending: false })

    if (alunosData) {
      setAlunos(alunosData as Aluno[])
    }
    
    setLoading(false)
  }

  const inviteLink = academiaId 
    ? `${window.location.origin}/register/aluno?academia_id=${academiaId}`
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Gestão de Alunos</h1>
            <p className="text-[#A6A6A6] mt-1">Gerencie matrículas e envie convites para novos alunos.</p>
          </div>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20"
          >
            + Convidar Aluno
          </Button>
        </header>

        <main className="mt-8">
          <div className="border border-[#585759] rounded-xl overflow-hidden bg-[#0D0D0D]/80 backdrop-blur-md shadow-xl shadow-[#0D0D0D]">
            <Table>
              <TableHeader className="bg-[#585759]/10">
                <TableRow className="border-[#585759]/30 hover:bg-transparent">
                  <TableHead className="text-[#A6A6A6] font-semibold">Nome do Aluno</TableHead>
                  <TableHead className="text-[#A6A6A6] font-semibold">Telefone</TableHead>
                  <TableHead className="text-[#A6A6A6] font-semibold">Data de Ingresso</TableHead>
                  <TableHead className="text-right text-[#A6A6A6] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-[#A6A6A6]">
                      Carregando alunos...
                    </TableCell>
                  </TableRow>
                ) : alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-[#A6A6A6]">
                      Nenhum aluno encontrado. Clique em "Convidar Aluno" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow key={aluno.id} className="border-[#585759]/30 hover:bg-[#585759]/10 transition-colors">
                      <TableCell className="font-medium text-white">{aluno.nome_completo || 'Sem Nome'}</TableCell>
                      <TableCell className="text-[#A6A6A6]">{aluno.telefone || 'Não informado'}</TableCell>
                      <TableCell className="text-[#A6A6A6]">
                        {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" className="text-[#F2B705] hover:text-[#BF9004] hover:bg-[#F2B705]/10">
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Convidar Novo Aluno</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-[#A6A6A6] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#A6A6A6] text-sm">
                Para adicionar um aluno, envie o link exclusivo abaixo para ele. O aluno fará o próprio cadastro com e-mail e senha, e será automaticamente vinculado à sua academia.
              </p>
              
              <div className="mt-4 p-4 bg-[#585759]/10 rounded-xl border border-[#585759]/30 flex items-center justify-between gap-4">
                <code className="text-[#F2B705] text-sm truncate flex-1 select-all">
                  {inviteLink || 'Gerando link...'}
                </code>
                <Button 
                  onClick={handleCopy}
                  variant="outline" 
                  size="icon"
                  className="shrink-0 border-[#585759] hover:bg-[#585759]/20 text-white"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="p-4 border-t border-[#585759]/30 bg-[#585759]/5 flex justify-end">
              <Button onClick={() => setShowInviteModal(false)} className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold">
                Concluído
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
