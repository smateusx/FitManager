'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import { createAcademia, getPerfil, registerPerfilAndClaimCpf, CpfAlreadyRegisteredError } from '@/lib/firestore'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { resolvePostLoginPath } from '@/lib/post-login'
import { AuthShell } from '@/components/auth-shell'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserCircle } from 'lucide-react'
import { updateProfile } from 'firebase/auth'

function CompletarCadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromQuery = searchParams.get('academia_id')
  const [inviteAcademiaId, setInviteAcademiaId] = useState<string | null>(fromQuery)
  const [registerIntent, setRegisterIntent] = useState<'admin' | 'aluno' | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [fullName, setFullName] = useState('')
  const [gymName, setGymName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!fromQuery) {
      try {
        const s = sessionStorage.getItem('fitmanager_pending_academia_id')
        if (s) setInviteAcademiaId(s)
        const intent = sessionStorage.getItem('fitmanager_register_intent')
        if (intent === 'aluno' || intent === 'admin') setRegisterIntent(intent)
      } catch {
        /* ignore */
      }
    } else {
      try {
        const intent = sessionStorage.getItem('fitmanager_register_intent')
        if (intent === 'aluno' || intent === 'admin') setRegisterIntent(intent)
      } catch {
        /* ignore */
      }
    }
  }, [fromQuery])

  useEffect(() => {
    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) {
      router.replace('/login')
      return
    }
    if (!u.emailVerified) {
      router.replace('/verificar-email')
      return
    }
    void (async () => {
      const p = await getPerfil(u.uid)
      if (p?.cpf) {
        const path = await resolvePostLoginPath(u)
        router.replace(path)
        return
      }
      setFullName(p?.nome_completo || u.displayName || '')
      setPhone(p?.telefone || '')
      try {
        const pendingGym = sessionStorage.getItem('fitmanager_pending_academy_name')
        const isAluno = Boolean(inviteAcademiaId || registerIntent === 'aluno')
        if (pendingGym && !isAluno) setGymName(pendingGym)
        const pendingPhone = sessionStorage.getItem('fitmanager_pending_phone')
        if (pendingPhone && !p?.telefone) setPhone(pendingPhone)
      } catch {
        /* ignore */
      }
      setLoading(false)
    })()
  }, [router, inviteAcademiaId, registerIntent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) return

    const digits = normalizeCpfDigits(cpf)
    if (!isValidCpf(digits)) {
      setErrorMsg('CPF inválido. Confira os números.')
      return
    }

    if (!fullName.trim()) {
      setErrorMsg('Informe seu nome completo.')
      return
    }

    const isAlunoFlow = Boolean(inviteAcademiaId || registerIntent === 'aluno')

    setSaving(true)
    try {
      await updateProfile(u, { displayName: fullName.trim() })

      if (isAlunoFlow) {
        if (!inviteAcademiaId) {
          setErrorMsg('Falta o convite da academia. Abra de novo o link de cadastro do aluno.')
          setSaving(false)
          return
        }
        await registerPerfilAndClaimCpf({
          userId: u.uid,
          cpfDigits: digits,
          nome_completo: fullName.trim(),
          role: 'ALUNO',
          academia_id: inviteAcademiaId,
          telefone: phone.trim() || null,
        })
        try {
          sessionStorage.removeItem('fitmanager_pending_academia_id')
          sessionStorage.removeItem('fitmanager_pending_phone')
          sessionStorage.removeItem('fitmanager_register_intent')
        } catch {
          /* ignore */
        }
      } else {
        if (!gymName.trim()) {
          setErrorMsg('Informe o nome da academia.')
          setSaving(false)
          return
        }
        const gymId = await createAcademia(gymName.trim())
        await registerPerfilAndClaimCpf({
          userId: u.uid,
          cpfDigits: digits,
          nome_completo: fullName.trim(),
          role: 'ADMIN',
          academia_id: gymId,
          telefone: phone.trim() || null,
        })
        try {
          sessionStorage.removeItem('fitmanager_pending_academy_name')
          sessionStorage.removeItem('fitmanager_pending_phone')
          sessionStorage.removeItem('fitmanager_register_intent')
        } catch {
          /* ignore */
        }
      }

      const path = await resolvePostLoginPath(u)
      router.replace(path)
    } catch (err) {
      if (err instanceof CpfAlreadyRegisteredError) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Não foi possível salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#F2B705]" />
      </div>
    )
  }

  const isAlunoUi = Boolean(inviteAcademiaId || registerIntent === 'aluno')

  return (
    <Card className="w-full max-w-lg border-[#585759] bg-[#0D0D0D]/85 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2B705]/20 text-[#F2B705] sm:mx-0">
          <UserCircle className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          {isAlunoUi ? 'Complete seu cadastro de aluno' : 'Complete seu cadastro'}
        </CardTitle>
        <CardDescription className="text-[#A6A6A6]">
          Um CPF só pode ter uma conta. Usamos isso para evitar cadastros duplicados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
              {errorMsg}
            </div>
          )}
          {!isAlunoUi && (
            <div className="space-y-2">
              <Label htmlFor="gymName" className="text-[#A6A6A6]">
                Nome da academia
              </Label>
              <Input
                id="gymName"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="Ex.: FitTech Gym"
                className="h-11 border-[#585759] bg-[#0D0D0D] text-white"
                required={!isAlunoUi}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[#A6A6A6]">
              Nome completo
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 border-[#585759] bg-[#0D0D0D] text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-[#A6A6A6]">
              CPF
            </Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              className="h-11 border-[#585759] bg-[#0D0D0D] text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#A6A6A6]">
              Telefone (opcional)
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 border-[#585759] bg-[#0D0D0D] text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 w-full bg-[#F2B705] font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
          >
            {saving ? 'Salvando...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-[#585759]/40 pt-4">
        <Link href="/login" className="w-full text-center text-sm text-[#585759] hover:text-[#F2B705]">
          Voltar
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function CompletarCadastroPage() {
  return (
    <AuthShell variant="wide">
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-[#F2B705]" />
          </div>
        }
      >
        <CompletarCadastroForm />
      </Suspense>
    </AuthShell>
  )
}
