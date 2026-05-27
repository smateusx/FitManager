'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updatePassword } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, setPerfil as savePerfilDoc } from '@/lib/firestore'
import { ProfilePhotoSection } from '@/components/profile-photo-section'
import { PasswordSessionAfterChange, type PasswordSessionMode } from '@/components/password-session-after-change'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'
import { User, Lock, Save, Loader2, ChevronLeft, Smartphone, LogOut } from 'lucide-react'

type PerfilDoc = NonNullable<Awaited<ReturnType<typeof getPerfil>>>

export default function AlunoPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<PerfilDoc | null>(null)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSessionMode, setPasswordSessionMode] = useState<PasswordSessionMode>('stay')

  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const u = getFirebaseAuth().currentUser
        if (!u) {
          router.push('/login')
          return
        }
        if (!u.emailVerified) {
          router.push('/verificar-email')
          return
        }
        if (cancelled) return
        setUserId(u.uid)

        const data = await getPerfil(u.uid)
        if (!data?.cpf) {
          router.push('/completar-cadastro')
          return
        }
        if (!data || cancelled) return

        setPerfil(data)
        setNome(data.nome_completo || '')
        setTelefone(data.telefone || '')
        setFotoUrl(data.foto_url ?? null)
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setFeedback(null)

    try {
      await savePerfilDoc(userId, {
        nome_completo: nome,
        telefone: telefone,
      })

      setFeedback({ variant: 'success', message: 'Perfil atualizado com sucesso!' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setFeedback({ variant: 'error', message: `Não foi possível atualizar o perfil: ${msg}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setFeedback({ variant: 'warning', message: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ variant: 'warning', message: 'As senhas não coincidem. Digite a mesma senha nos dois campos.' })
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u) return
      await updatePassword(u, newPassword)

      if (passwordSessionMode === 'sign_out_here') {
        setNewPassword('')
        setConfirmPassword('')
        await signOut(auth)
        router.push('/login')
        return
      }

      setNewPassword('')
      setConfirmPassword('')
      setPasswordSessionMode('stay')
      await u.reload()
      setFeedback({ variant: 'success', message: 'Senha alterada com sucesso.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setFeedback({ variant: 'error', message: `Não foi possível alterar a senha: ${msg}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0D0D0D] py-16">
        <Loader2 className="w-8 h-8 text-[#F2B705] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-[#0D0D0D] pb-10 text-white">
      <nav className="sticky top-0 z-30 border-b border-[#585759]/30 bg-[#0D0D0D]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <button
            onClick={() => router.push('/meu-treino')}
            className="flex items-center gap-2 text-[#A6A6A6] hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Voltar ao Treino</span>
          </button>

          <button
            onClick={async () => {
              await signOut(getFirebaseAuth())
              router.push('/login')
            }}
            className="p-2 text-[#A6A6A6] hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">Meu Perfil</h1>
          <p className="text-[#A6A6A6] mt-1">Configure sua conta e mantenha seus dados atualizados.</p>
        </header>

        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
            autoDismissMs={feedback.variant === 'success' ? 4000 : undefined}
            className="mb-8"
          />
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <aside className="lg:col-span-1">
            <div className="flex flex-col items-center rounded-2xl border border-[#585759]/30 bg-[#0D0D0D]/60 p-6 text-center sm:p-8">
              {userId ? (
                <ProfilePhotoSection
                  userId={userId}
                  displayName={nome || perfil?.nome_completo || '?'}
                  fotoUrl={fotoUrl}
                  onChange={setFotoUrl}
                />
              ) : null}
            </div>
          </aside>

          <div className="lg:col-span-2 space-y-8 lg:space-y-10">
            <form onSubmit={handleUpdateProfile} className="space-y-6 p-6 border border-[#585759]/30 rounded-2xl bg-[#0D0D0D]/50">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-[#F2B705]" />
                <h2 className="text-xl font-bold">Dados Pessoais</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Telefone
                </Label>
                <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
              </div>

              <Button type="submit" disabled={saving} className="bg-[#F2B705] text-[#0D0D0D] font-bold">
                <Save className="w-4 h-4 mr-2" /> Salvar alterações
              </Button>
            </form>

            <form onSubmit={handleChangePassword} className="space-y-6 p-6 border border-[#585759]/30 rounded-2xl bg-[#0D0D0D]/50">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-[#F2B705]" />
                <h2 className="text-xl font-bold">Segurança</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
                </div>
              </div>

              <PasswordSessionAfterChange value={passwordSessionMode} onChange={setPasswordSessionMode} />

              <Button type="submit" disabled={saving} variant="outline" className="border-[#F2B705] text-[#F2B705]">
                Alterar senha
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
