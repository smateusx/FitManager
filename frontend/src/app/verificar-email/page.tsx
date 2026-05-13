'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import { sendEmailVerification } from 'firebase/auth'
import { AuthShell } from '@/components/auth-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { resolvePostLogin } from '@/lib/post-login'

export default function VerificarEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) {
      router.replace('/login')
      return
    }
    setEmail(u.email ?? '')
    void u.reload().then(async () => {
      const fresh = auth.currentUser
      if (fresh?.emailVerified) {
        const r = await resolvePostLogin(fresh)
        if (!r.ok) {
          router.replace(`/login?erro=${encodeURIComponent(r.message)}`)
          return
        }
        router.replace(r.path)
        return
      }
      setLoading(false)
    })
  }, [router])

  async function handleResend() {
    const u = getFirebaseAuth().currentUser
    if (!u) return
    setSending(true)
    setInfo(null)
    try {
      await sendEmailVerification(u)
      setInfo('Enviamos outro e-mail. Verifique a caixa de entrada e o spam.')
    } catch {
      setInfo('Não foi possível reenviar agora. Tente de novo em alguns minutos.')
    } finally {
      setSending(false)
    }
  }

  async function handleCheck() {
    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) return
    setLoading(true)
    try {
      await u.reload()
      const fresh = auth.currentUser
      if (fresh?.emailVerified) {
        const r = await resolvePostLogin(fresh)
        if (!r.ok) {
          router.replace(`/login?erro=${encodeURIComponent(r.message)}`)
        } else {
          router.replace(r.path)
        }
      } else {
        setInfo('Ainda não detectamos a verificação. Abra o link no e-mail ou aguarde um instante.')
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#F2B705]" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card className="w-full border-[#585759] bg-[#0D0D0D]/85 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2B705]/15 text-[#F2B705]">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Confirme seu e-mail</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Enviamos um link para <span className="font-medium text-white">{email}</span>. Só assim conseguimos evitar
            cadastros falsos e garantir que você tem acesso à caixa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {info && (
            <p className="rounded-lg border border-[#585759]/40 bg-[#141414] p-3 text-center text-sm text-[#A6A6A6]">
              {info}
            </p>
          )}
          <Button
            type="button"
            className="h-11 w-full bg-[#F2B705] font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
            onClick={handleCheck}
          >
            Já confirmei — continuar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-[#585759] text-white hover:bg-[#585759]/20"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? 'Enviando...' : 'Reenviar e-mail'}
          </Button>
          <p className="text-center text-xs text-[#585759]">
            <Link href="/login" className="text-[#F2B705] hover:underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
