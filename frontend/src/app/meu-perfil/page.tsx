'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { 
  User, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft,
  Smartphone,
  LogOut
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type PerfilUsuario = {
  id: string
  nome_completo: string | null
  telefone: string | null
  avatar_url: string | null
}

export default function AlunoPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const router = useRouter()

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      setUser(session.user)

      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      
      const perfilData = data as PerfilUsuario
      setPerfil(perfilData)
      setNome(perfilData.nome_completo || '')
      setTelefone(perfilData.telefone || '')
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          nome_completo: nome,
          telefone: telefone
        })
        .eq('id', user.id)

      if (error) throw error
      
      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      alert(`Erro ao atualizar perfil: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setSuccess('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      alert(`Erro ao alterar senha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(url: string) {
    if (!user) return
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ avatar_url: url })
        .eq('id', user.id)

      if (error) throw error
      
      setPerfil((current) => (current ? { ...current, avatar_url: url } : current))
      setSuccess('Foto de perfil atualizada!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      alert(`Erro ao salvar URL do avatar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
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
      {/* Mini Header */}
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
              await supabase.auth.signOut()
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
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#0D0D0D] border border-[#585759]/30 rounded-3xl p-8 shadow-2xl">
              <AvatarUpload 
                uid={user?.id || ''} 
                url={perfil?.avatar_url ?? null} 
                onUpload={handleAvatarUpload} 
              />
              
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-[#585759]/5 rounded-2xl border border-[#585759]/10">
                  <p className="text-[10px] text-[#585759] uppercase font-bold tracking-widest mb-1">E-mail</p>
                  <p className="text-white text-xs truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações Pessoais */}
            <section className="bg-[#585759]/5 border border-[#585759]/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-[#F2B705]" />
                <h2 className="text-xl font-bold text-white">Dados Pessoais</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Nome Completo</Label>
                  <Input 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required
                    className="bg-[#0D0D0D] border-[#585759]/30 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">WhatsApp</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#585759]" />
                    <Input 
                      value={telefone} 
                      onChange={e => setTelefone(e.target.value)} 
                      placeholder="(00) 00000-0000"
                      className="bg-[#0D0D0D] border-[#585759]/30 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl pl-12"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold h-12 rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
                </Button>
              </form>
            </section>

            {/* Segurança */}
            <section className="bg-[#585759]/5 border border-[#585759]/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-white">Alterar Senha</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Nova Senha</Label>
                    <Input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required
                      minLength={6}
                      className="bg-[#0D0D0D] border-[#585759]/30 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Repetir Senha</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required
                      minLength={6}
                      className="bg-[#0D0D0D] border-[#585759]/30 text-white focus-visible:ring-[#F2B705] h-12 rounded-xl"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={saving || !newPassword}
                  className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold h-12 rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
