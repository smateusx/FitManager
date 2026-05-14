'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, listAlunosByAcademia } from '@/lib/firestore'
import { Copy, X, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type Aluno = {
  id: string
  nome_completo: string
  telefone: string | null
  created_at: string
}

type InviteModal = 'aluno' | 'recepcionista' | null

export default function AlunosPage() {
  const { loading: authLoading, isAdmin } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [inviteModal, setInviteModal] = useState<InviteModal>(null)
  const [copied, setCopied] = useState(false)

  const fetchAlunos = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (authLoading) return
    queueMicrotask(() => {
      void fetchAlunos()
    })
  }, [authLoading, fetchAlunos])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteAlunoLink = academiaId ? `${origin}/register/aluno?academia_id=${academiaId}` : ''
  const inviteRecepcionistaLink = academiaId ? `${origin}/register/recepcionista?academia_id=${academiaId}` : ''

  const activeInviteLink = inviteModal === 'recepcionista' ? inviteRecepcionistaLink : inviteAlunoLink

  const handleCopy = () => {
    if (!activeInviteLink) return
    void navigator.clipboard.writeText(activeInviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!activeInviteLink) return
    const msg =
      inviteModal === 'recepcionista'
        ? 'Olá! Você foi convidado para a equipe de receção da academia. Cadastre-se pelo link:'
        : 'Olá! Complete seu cadastro na academia pelo link:'
    const text = encodeURIComponent(`${msg}\n${activeInviteLink}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#585759]/30 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Gestão de Alunos</h1>
            <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">
              Gerencie matrículas e envie convites para novos alunos.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              onClick={() => setInviteModal('aluno')}
              className="bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 hover:bg-[#BF9004]"
            >
              + Convidar aluno
            </Button>
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteModal('recepcionista')}
                className="border-[#585759] bg-transparent text-white hover:bg-[#585759]/25"
              >
                + Convidar receção
              </Button>
            )}
          </div>
        </header>

        <main className="mt-6 sm:mt-8">
          <div className="overflow-x-auto rounded-xl border border-[#585759] bg-[#0D0D0D]/80 shadow-xl shadow-[#0D0D0D] backdrop-blur-md">
            <Table className="min-w-[640px]">
              <TableHeader className="bg-[#585759]/10">
                <TableRow className="border-[#585759]/30 hover:bg-transparent">
                  <TableHead className="font-semibold text-[#A6A6A6]">Nome do Aluno</TableHead>
                  <TableHead className="font-semibold text-[#A6A6A6]">Telefone</TableHead>
                  <TableHead className="font-semibold text-[#A6A6A6]">Data de Ingresso</TableHead>
                  <TableHead className="text-right font-semibold text-[#A6A6A6]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-[#585759]">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-[#585759]">
                      Nenhum aluno cadastrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow key={aluno.id} className="border-[#585759]/20 hover:bg-[#585759]/5">
                      <TableCell className="font-medium text-white">{aluno.nome_completo}</TableCell>
                      <TableCell className="text-[#A6A6A6]">{aluno.telefone || 'Não informado'}</TableCell>
                      <TableCell className="text-[#A6A6A6]">
                        {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/alunos/${aluno.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#F2B705] hover:text-[#BF9004]">
                            Detalhes <ChevronRight className="ml-1 h-4 w-4" />
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

      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#585759] bg-[#0D0D0D] p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setInviteModal(null)}
              className="absolute right-4 top-4 text-[#585759] hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
              {inviteModal === 'recepcionista' ? 'Convite receção' : 'Link de convite aluno'}
            </h2>
            <p className="mb-6 text-sm text-[#A6A6A6]">
              {inviteModal === 'recepcionista'
                ? 'Envie o link para um membro da receção. Ele criará a conta com e-mail e senha, confirmará o e-mail e informará o CPF. Acesso à gestão operacional, sem permissões de dono.'
                : 'Envie o link ao aluno para criar a conta; ele será vinculado à sua academia automaticamente.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={activeInviteLink}
                className="min-w-0 flex-1 rounded-lg border border-[#585759] bg-[#585759]/10 px-3 py-3 text-xs text-white sm:text-sm"
              />
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 bg-[#F2B705] font-bold text-[#0D0D0D] sm:flex-none"
                  aria-label="Copiar link"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="flex-1 gap-1 border-emerald-600/50 bg-emerald-600/10 px-3 text-emerald-400 hover:bg-emerald-600/20 sm:flex-none"
                  aria-label="Compartilhar no WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
