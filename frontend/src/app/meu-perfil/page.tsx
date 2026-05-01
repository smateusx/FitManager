'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updatePassword } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, setPerfil as savePerfilDoc } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { User, Lock, Save, Loader2, CheckCircle2, ChevronLeft, Smartphone, LogOut } from 'lucide-react'

export default function AlunoPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<any>(null)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const u = getFirebaseAuth().currentUser
      if (!u) {
        router.push('/login')
        return
      }
      setUserId(u.uid)

      const data = await getPerfil(u.uid)
      if (!data) return

      setPerfil(data)
      setNome(data.nome_completo || '')
      setTelefone(data.telefone || '')
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

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
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!')
      return
    }

    setSaving(true)
    try {
      const u = getFirebaseAuth().currentUser
      if (!u) return
      await updatePassword(u, newPassword)

      setSuccess('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro'
      alert('Erro ao alterar senha: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(url: string) {
    if (!userId) return
    try {
      await savePerfilDoc(userId, { avatar_url: url })

      setPerfil({ ...perfil, avatar_url: url })
      setSuccess('Foto de perfil atualizada!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro'
      alert('Erro ao salvar URL do avatar: ' + msg)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="w-8 h-8 text-[#F2B705] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <nav className="sticky top-0 z-30 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-[#585759]/30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto p-6 lg:p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">Meu Perfil</h1>
          <p className="text-[#A6A6A6] mt-1">Configure sua conta e mantenha seus dados atualizados.</p>
        </header>

        {success && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 flex flex-col items-center">
            {userId && <AvatarUpload uid={userId} url={perfil?.avatar_url} onUpload={handleAvatarUpload} />}
          </div>

          <div className="lg:col-span-2 space-y-10">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#0D0D0D] border-[#585759]" />
                </div>
              </div>

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
