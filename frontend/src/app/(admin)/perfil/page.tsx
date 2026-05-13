'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword, signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, setPerfil as savePerfilDoc } from '@/lib/firestore'
import { PasswordSessionAfterChange, type PasswordSessionMode } from '@/components/password-session-after-change'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Smartphone, User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile-avatar'

type PerfilDoc = NonNullable<Awaited<ReturnType<typeof getPerfil>>>

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<PerfilDoc | null>(null)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSessionMode, setPasswordSessionMode] = useState<PasswordSessionMode>('stay')

  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const u = getFirebaseAuth().currentUser
        if (!u || cancelled) {
          router.replace('/login')
          return
        }
        if (!u.emailVerified) {
          router.replace('/verificar-email')
          return
        }

        setUserId(u.uid)
        setUserEmail(u.email ?? null)

        const data = await getPerfil(u.uid)
        if (cancelled) return
        if (!data?.cpf) {
          router.replace('/completar-cadastro')
          return
        }

        setPerfil(data)
        setNome(data.nome_completo || '')
        setTelefone(data.telefone || '')
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
    setSuccess(null)

    try {
      await savePerfilDoc(userId, {
        nome_completo: nome,
        telefone: telefone,
      })

      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro'
      alert('Erro ao atualizar perfil: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!')
      return
    }

    setSaving(true)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u) return
      await updatePassword(u, newPassword)

      const logoutPath =
        perfil?.role === 'RECEPCIONISTA' ? '/login/recepcionista' : '/login/academia'

      if (passwordSessionMode === 'sign_out_here') {
        setNewPassword('')
        setConfirmPassword('')
        await signOut(auth)
        router.replace(logoutPath)
        return
      }

      setNewPassword('')
      setConfirmPassword('')
      setPasswordSessionMode('stay')
      await u.reload()
      setSuccess('Senha alterada com sucesso.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro'
      alert('Erro ao alterar senha: ' + msg)
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
    <div className="min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="pb-8 border-b border-[#585759]/30 mb-8">
          <h1 className="text-3xl font-bold text-[#F2B705]">Configurações de Perfil</h1>
          <p className="text-[#A6A6A6] mt-1">Gerencie suas informações pessoais e segurança da conta.</p>
        </header>

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-[#585759]/30 bg-[#0D0D0D] p-6 shadow-2xl sm:p-8">
              <div className="flex flex-col items-center text-center">
                {userId ? (
                  <div className="flex flex-col items-center gap-3">
                    <ProfileAvatar name={nome || perfil?.nome_completo || '?'} sizeClass="h-24 w-24 text-2xl" />
                    <p className="text-sm font-medium text-white">{nome || perfil?.nome_completo || 'Perfil'}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 space-y-4">
                <div className="p-4 bg-[#585759]/10 rounded-2xl border border-[#585759]/20">
                  <p className="text-[10px] text-[#A6A6A6] uppercase font-bold tracking-widest mb-1">E-mail de Acesso</p>
                  <p className="text-white text-sm truncate font-medium">{userEmail}</p>
                </div>
                <div className="p-4 bg-[#585759]/10 rounded-2xl border border-[#585759]/20">
                  <p className="text-[10px] text-[#A6A6A6] uppercase font-bold tracking-widest mb-1">Nível de Acesso</p>
                  <div className="flex items-center gap-2 text-[#F2B705]">
                    <Shield className="w-4 h-4" />
                    <p className="text-xs font-bold">{perfil?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#0D0D0D] border border-[#585759]/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                  <User className="w-5 h-5 text-[#F2B705]" />
                </div>
                <h2 className="text-xl font-bold text-white">Informações Pessoais</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Nome Completo</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="bg-[#0D0D0D] border-[#585759]/50 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#585759]" />
                    <Input
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="bg-[#0D0D0D] border-[#585759]/50 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl pl-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold h-12 rounded-xl shadow-lg shadow-[#F2B705]/10"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </section>

            <section className="bg-[#0D0D0D] border border-[#585759]/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Segurança</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Nova Senha</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-[#0D0D0D] border-[#585759]/50 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Confirmar Senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-[#0D0D0D] border-[#585759]/50 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                    />
                  </div>
                </div>

                <PasswordSessionAfterChange value={passwordSessionMode} onChange={setPasswordSessionMode} />

                <Button
                  type="submit"
                  disabled={saving || !newPassword}
                  className="w-full bg-[#585759]/20 border border-[#585759]/50 text-white hover:bg-[#585759]/30 font-bold h-12 rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
