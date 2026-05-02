'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { createAcademia, createAdminPerfil } from '@/lib/firestore'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth-shell'
import { Building2 } from 'lucide-react'

export default function RegisterPage() {
  const [gymName, setGymName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const auth = getFirebaseAuth()
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: fullName.trim() })

      const gymId = await createAcademia(gymName.trim())
      await createAdminPerfil(cred.user.uid, fullName.trim(), gymId)

      router.push('/dashboard')
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

  return (
    <AuthShell variant="wide">
      <Card className="w-full border-[#585759] bg-[#0D0D0D]/85 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 pb-6 text-center sm:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2B705] shadow-lg shadow-[#F2B705]/20 sm:mx-0">
            <Building2 className="h-6 w-6 text-[#0D0D0D]" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Cadastre sua academia</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Crie a conta de administrador e comece a usar o painel. Os dados ficam no Firebase (Auth + Firestore).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="gymName" className="text-[#A6A6A6]">
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
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#A6A6A6]">
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
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#A6A6A6]">
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#A6A6A6]">
                  Senha (mín. 6 caracteres)
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
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 transition-all hover:bg-[#BF9004]"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 border-t border-[#585759]/50 pt-4">
          <p className="text-center text-sm text-[#A6A6A6]">
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold text-[#F2B705] transition-colors hover:text-[#BF9004]">
              Entrar
            </Link>
          </p>
          <Link href="/" className="block text-center text-xs text-[#585759] transition-colors hover:text-[#A6A6A6]">
            ← Voltar ao início
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
