'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth-shell'
import { Building2, Mail } from 'lucide-react'

export default function RegisterPage() {
  const [gymName, setGymName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (password !== passwordConfirm) {
      setErrorMsg('As senhas não coincidem.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      const auth = getFirebaseAuth()
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: fullName.trim() })

      await sendEmailVerification(cred.user)

      try {
        sessionStorage.removeItem('fitmanager_pending_academia_id')
        sessionStorage.removeItem('fitmanager_register_intent')
        sessionStorage.setItem('fitmanager_pending_academy_name', gymName.trim())
        sessionStorage.setItem('fitmanager_register_intent', 'admin')
      } catch {
        /* ignore */
      }

      await signOut(auth)
      setSent(true)
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : ''
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está em uso. Faça login ou use outro endereço.')
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Use uma senha mais forte (pelo menos 6 caracteres).')
      } else {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        setErrorMsg('Não foi possível criar a conta: ' + msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell variant="wide">
        <Card className="w-full border border-emerald-500/30 bg-[#0D0D0D]/90 shadow-xl backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-3 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold text-white">Confirme o e-mail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-[#A6A6A6]">
              Enviamos um link para <span className="font-medium text-white">{email.trim()}</span>. Depois de confirmar,
              faça login para completar o cadastro.
            </p>
            <Button
              type="button"
              className="h-11 w-full bg-[#F2B705] font-semibold text-[#0D0D0D] hover:bg-[#BF9004]"
              onClick={() => router.push('/login/academia')}
            >
              Ir para o login
            </Button>
            <p className="text-center text-[11px] text-[#585759]">Confira também spam e promoções.</p>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell variant="wide">
      <Card className="w-full border border-[#585759]/35 bg-[#0D0D0D]/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2B705]">
            <Building2 className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-white">Nova academia</CardTitle>
          <p className="text-sm text-[#585759]">Confirme o e-mail após criar a conta; depois complete CPF e dados da unidade.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
                {errorMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="gymName" className="text-xs text-[#A6A6A6]">
                Nome da academia
              </Label>
              <Input
                id="gymName"
                placeholder="Ex.: FitTech Gym"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-[#A6A6A6]">
                Seu nome completo
              </Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="email" className="text-xs text-[#A6A6A6]">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@academia.com"
                  className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-[#A6A6A6]">
                  Senha (mín. 6)
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={6}
                  className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirm" className="text-xs text-[#A6A6A6]">
                  Confirmar senha
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  minLength={6}
                  className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="mt-1 h-11 w-full bg-[#F2B705] font-semibold text-[#0D0D0D] hover:bg-[#BF9004]"
              disabled={loading}
            >
              {loading ? 'Criando…' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-[#585759]/30 pt-4">
          <p className="text-center text-sm text-[#A6A6A6]">
            Já tem conta?{' '}
            <Link href="/login/academia" className="font-medium text-[#F2B705] hover:text-[#BF9004]">
              Entrar
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
