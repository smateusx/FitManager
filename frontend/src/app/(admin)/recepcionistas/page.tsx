'use client'

import { useCallback, useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, listRecepcionistasByAcademia } from '@/lib/firestore'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Row = {
  id: string
  nome_completo: string
  telefone: string | null
  created_at: string
}

export default function RecepcionistasPage() {
  const router = useRouter()
  const { loading: authLoading, isAdmin } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const u = getFirebaseAuth().currentUser
    if (!u) {
      router.push('/login')
      return
    }
    const p = await getPerfil(u.uid)
    if (!p?.academia_id || !isAdmin) {
      setLoading(false)
      return
    }
    const data = await listRecepcionistasByAcademia(p.academia_id)
    setRows(data as Row[])
    setLoading(false)
  }, [router, isAdmin])

  useEffect(() => {
    if (authLoading) return
    if (!isAdmin) {
      router.replace('/dashboard')
      return
    }
    queueMicrotask(() => {
      void load()
    })
  }, [authLoading, isAdmin, load, router])

  return (
    <div className="relative min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#585759]/30 pb-6 sm:pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Recepcionistas</h1>
            <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">
              Lista da equipe de receção vinculada à sua academia.
            </p>
          </div>
          <p className="text-xs text-[#585759]">
            Para convidar alguém novo, use Alunos e o botão &quot;Convidar receção&quot;.
          </p>
        </header>

        <main className="mt-6 sm:mt-8">
          <div className="overflow-x-auto rounded-xl border border-[#585759] bg-[#0D0D0D]/80 shadow-xl shadow-[#0D0D0D] backdrop-blur-md">
            <Table className="min-w-[560px]">
              <TableHeader className="bg-[#585759]/10">
                <TableRow className="border-[#585759]/30 hover:bg-transparent">
                  <TableHead className="font-semibold text-[#A6A6A6]">Nome</TableHead>
                  <TableHead className="font-semibold text-[#A6A6A6]">Telefone</TableHead>
                  <TableHead className="font-semibold text-[#A6A6A6]">Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-[#585759]">
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-[#585759]">
                      Nenhuma recepcionista cadastrada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className="border-[#585759]/20 hover:bg-[#585759]/5">
                      <TableCell className="font-medium text-white">{r.nome_completo}</TableCell>
                      <TableCell className="text-[#A6A6A6]">{r.telefone || 'Não informado'}</TableCell>
                      <TableCell className="text-[#A6A6A6]">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  )
}
