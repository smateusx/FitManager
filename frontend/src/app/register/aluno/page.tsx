'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { seedAlunoInviteProfile } from '@/lib/firestore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth-shell'
import { CheckCircle2, Mail } from 'lucide-react'

function RegisterAlunoForm() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const searchParams = useSearchParams()
  const academiaId = searchParams.get('academia_id')
  const router = useRouter()

  useEffect(() => {
    if (!academiaId) return
    try {
      sessionStorage.setItem('fitmanager_pending_academia_id', academiaId)
      sessionStorage.setItem('fitmanager_register_intent', 'aluno')
    } catch {
      /* ignore */
    }
  }, [academiaId])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return

    if (password !== passwordConfirm) {
      setErrorMsg('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const auth = getFirebaseAuth()
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: fullName.trim() })
      await seedAlunoInviteProfile({
        userId: cred.user.uid,
        academia_id: academiaId,
        nome_completo: fullName.trim() || null,
        telefone: phone.trim() || null,
      })
      await sendEmailVerification(cred.user)
      try {
        sessionStorage.setItem('fitmanager_pending_phone', phone.trim())
      } catch {
        /* ignore */
      }
      await signOut(auth)
      setSuccess(true)
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : ''
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está em uso.')
      } else {
        const msg = err instanceof Error ? err.message : 'Erro ao criar conta'
        setErrorMsg('Erro ao criar conta: ' + msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell>
        <Card className="w-full border-emerald-500/25 bg-[#0D0D0D]/85 backdrop-blur-xl text-center shadow-2xl">
          <CardContent className="space-y-5 pt-10 pb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Quase lá</h1>
            <p className="mx-auto flex max-w-sm items-start gap-2 text-sm text-[#A6A6A6]">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B705]" />
              Confirme o link que enviamos para seu e-mail. Depois faça login — vamos pedir seu CPF na próxima tela.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-[#F2B705] font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
            >
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card className="w-full border-[#585759] bg-[#0D0D0D]/85 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 pb-6 text-center sm:text-left">
          <CardTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Portal do aluno</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Use o link que sua academia enviou. Após criar a conta, confirme o e-mail antes de entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!academiaId && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
              Link de convite inválido. Solicite um novo link à sua academia.
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#A6A6A6]">
                Nome completo
              </Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#A6A6A6]">
                Telefone / WhatsApp (opcional)
              </Label>
              <Input
                id="phone"
                placeholder="(DDD) 99999-9999"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#A6A6A6]">
                  Senha (mín. 6)
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-[#A6A6A6]">
                  Confirmar senha
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita"
                  className="h-11 border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 transition-all hover:bg-[#BF9004]"
              disabled={loading || !academiaId}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="border-t border-[#585759]/50 pt-4">
          <Link href="/login" className="w-full text-center text-sm text-[#A6A6A6] hover:text-[#F2B705]">
            Já tenho conta — entrar
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}

export default function RegisterAlunoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#585759] border-t-[#F2B705]" />
        </div>
      }
    >
      <RegisterAlunoForm />
    </Suspense>
  )
}
