'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth-shell'
import { Dumbbell } from 'lucide-react'
import { GoogleIcon } from '@/components/google-icon'
import { resolvePostLoginPath } from '@/lib/post-login'

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
  if (code === 'auth/popup-closed-by-user') {
    return 'Login cancelado.'
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'Já existe uma conta com este e-mail usando outro método. Entre com e-mail e senha.'
  }
  return 'Não foi possível entrar. Verifique os dados e tente novamente.'
}

const googleProvider = new GoogleAuthProvider()

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setResetMsg(null)

    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      await cred.user.reload()
      const path = await resolvePostLoginPath(cred.user)
      router.push(path)
    } catch (err) {
      setErrorMsg(firebaseAuthMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setErrorMsg('')
    setResetMsg(null)
    try {
      const cred = await signInWithPopup(getFirebaseAuth(), googleProvider)
      await cred.user.reload()
      const path = await resolvePostLoginPath(cred.user)
      router.push(path)
    } catch (err) {
      setErrorMsg(firebaseAuthMessage(err))
    } finally {
      setGoogleLoading(false)
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
      <Card className="w-full border border-[#585759]/35 bg-[#0D0D0D]/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2B705]">
            <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-white">Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 border-[#585759]/50 bg-[#0D0D0D] text-white hover:bg-[#585759]/15 hover:text-white"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
          >
            <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
            <span>{googleLoading ? 'Abrindo Google…' : 'Continuar com Google'}</span>
          </Button>
          <div className="relative py-0.5 text-center text-[11px] uppercase tracking-wider text-[#585759]">
            <span className="relative z-10 bg-[#0D0D0D] px-2">ou e-mail</span>
            <div className="absolute left-0 right-0 top-1/2 border-t border-[#585759]/35" />
          </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-[#A6A6A6]">
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
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="password" className="text-xs text-[#A6A6A6]">
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
              disabled={loading || googleLoading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-[#585759]/30 pt-4">
          <p className="text-center text-sm text-[#A6A6A6]">
            Sem conta?{' '}
            <Link href="/register" className="font-medium text-[#F2B705] hover:text-[#BF9004]">
              Cadastrar academia
            </Link>
          </p>
          <Link href="/" className="block text-center text-xs text-[#585759] hover:text-[#A6A6A6]">
            Início
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
