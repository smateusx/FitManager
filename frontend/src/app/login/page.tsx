'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell } from 'lucide-react'

function LoginHubInner() {
  const searchParams = useSearchParams()
  const erro = searchParams.get('erro')

  return (
    <div className="w-full max-w-md space-y-4">
      {erro ? (
        <div
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-100"
          role="alert"
        >
          {erro}
        </div>
      ) : null}

      <Card className="w-full border border-[#585759]/35 bg-[#0D0D0D]/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2B705]">
            <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-white">Entrar no FitManager</CardTitle>
          <p className="text-sm text-[#585759]">Escolha como você usa o sistema.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-6">
          <Link
            href="/login/academia"
            className="rounded-xl border border-[#585759]/40 bg-[#0D0D0D] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-[#F2B705]/50 hover:bg-[#585759]/10"
          >
            Academia (dono ou administrador)
          </Link>
          <Link
            href="/login/recepcionista"
            className="rounded-xl border border-[#585759]/40 bg-[#0D0D0D] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-[#F2B705]/50 hover:bg-[#585759]/10"
          >
            Recepção
          </Link>
          <Link
            href="/login/aluno"
            className="rounded-xl border border-[#585759]/40 bg-[#0D0D0D] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-[#F2B705]/50 hover:bg-[#585759]/10"
          >
            Aluno
          </Link>
        </CardContent>
      </Card>

      <Link href="/" className="block text-center text-xs text-[#585759] hover:text-[#A6A6A6]">
        Início
      </Link>
    </div>
  )
}

export default function LoginHubPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex w-full max-w-md justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#585759]/50 border-t-[#F2B705]" />
          </div>
        }
      >
        <LoginHubInner />
      </Suspense>
    </AuthShell>
  )
}
