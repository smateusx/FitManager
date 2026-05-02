'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth-shell'
import { Dumbbell } from 'lucide-react'

function firebaseAuthMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string'
      ? (err as { code: string }).code
      : ''
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'E-mail ou senha incorretos. Tente novamente.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Muitas tentativas. Aguarde um momento e tente de novo.'
  }
  if (code === 'auth/network-request-failed') {
    return 'Sem conexão. Verifique a internet.'
  }
  return 'Não foi possível entrar. Verifique os dados e tente novamente.'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setResetMsg(null)

    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      router.push('/dashboard')
    } catch (err) {
      setErrorMsg(firebaseAuthMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setErrorMsg('Digite seu e-mail acima para recuperar a senha.')
      return
    }
    setResetMsg(null)
    setErrorMsg('')
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), trimmed)
      setResetMsg('Enviamos um e-mail com o link para redefinir a senha.')
    } catch {
      setErrorMsg('Não foi possível enviar o e-mail de recuperação. Verifique o endereço.')
    }
  }

  return (
    <AuthShell>
      <Card className="w-full border-[#585759] bg-[#0D0D0D]/85 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 pb-6 text-center sm:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2B705] shadow-lg shadow-[#F2B705]/20 sm:mx-0">
            <Dumbbell className="h-6 w-6 text-[#0D0D0D]" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Entre com a conta da academia para abrir o painel. Alunos usam o mesmo login e vão para o portal de treino.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
                {errorMsg}
              </div>
            )}
            {resetMsg && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                {resetMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A6A6A6]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="password" className="text-[#A6A6A6]">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-sm font-medium text-[#F2B705] underline-offset-4 hover:text-[#BF9004] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white focus-visible:ring-[#F2B705]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 transition-all hover:bg-[#BF9004]"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 border-t border-[#585759]/50 pt-4">
          <p className="text-center text-sm text-[#A6A6A6]">
            Novo por aqui?{' '}
            <Link href="/register" className="font-semibold text-[#F2B705] transition-colors hover:text-[#BF9004]">
              Cadastre sua academia
            </Link>
          </p>
          <Link
            href="/"
            className="block text-center text-xs text-[#585759] transition-colors hover:text-[#A6A6A6]"
          >
            ← Voltar ao início
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
