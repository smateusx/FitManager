'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, listAlunosByAcademia } from '@/lib/firestore'
import { Copy, X, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type Aluno = {
  id: string
  nome_completo: string
  telefone: string | null
  created_at: string
}

export default function AlunosPage() {
  const { profile, loading: authLoading, isAdmin, isReceptionist } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (authLoading) return
    fetchAlunos()
  }, [authLoading])

  const fetchAlunos = async () => {
    setLoading(true)
    const u = getFirebaseAuth().currentUser
    if (!u) return

    const adminProfile = await getPerfil(u.uid)
    if (adminProfile?.academia_id) {
      setAcademiaId(adminProfile.academia_id)
      const alunosData = await listAlunosByAcademia(adminProfile.academia_id)
      setAlunos(alunosData as Aluno[])
    }

    setLoading(false)
  }

  const inviteLink = academiaId ? `${window.location.origin}/register/aluno?academia_id=${academiaId}` : ''

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
                    <TableCell colSpan={4} className="text-center py-12 text-[#585759]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-[#585759]">
                      Nenhum aluno cadastrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow key={aluno.id} className="border-[#585759]/20 hover:bg-[#585759]/5">
                      <TableCell className="font-medium text-white">{aluno.nome_completo}</TableCell>
                      <TableCell className="text-[#A6A6A6]">{aluno.telefone || '—'}</TableCell>
                      <TableCell className="text-[#A6A6A6]">
                        {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/alunos/${aluno.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#F2B705] hover:text-[#BF9004]">
                            Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-[#585759] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Link de Convite</h2>
            <p className="text-[#A6A6A6] text-sm mb-6">
              Para adicionar um aluno, envie o link exclusivo abaixo para ele. O aluno fará o próprio cadastro com e-mail e
              senha, e será automaticamente vinculado à sua academia.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#585759]/10 border border-[#585759] rounded-lg px-4 py-3 text-sm text-white"
              />
              <Button onClick={handleCopy} className="bg-[#F2B705] text-[#0D0D0D] font-bold shrink-0">
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
