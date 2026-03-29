'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

function RegisterAlunoForm() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const searchParams = useSearchParams()
  const academiaId = searchParams.get('academia_id')
  const router = useRouter()

  useEffect(() => {
    if (!academiaId) {
      setErrorMsg('Link de convite inválido. Solicite um novo link à sua academia.')
    }
  }, [academiaId])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return

    setLoading(true)
    setErrorMsg('')

    // Passa academia_id nos metadados — o trigger já cria o perfil com o vínculo correto
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: fullName,
          academia_id: academiaId,  // <-- trigger lê isso e salva no perfil
        }
      }
    })

    if (authError) {
      setErrorMsg('Erro ao criar conta: ' + authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setErrorMsg('Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Atualizar telefone (não é coberto pelo trigger, mas com a sessão ativa do novo aluno funciona)
    if (phone) {
      await new Promise(r => setTimeout(r, 600)) // aguarda o trigger criar o perfil
      await supabase.from('perfis').update({ telefone: phone }).eq('id', authData.user.id)
    }

    // Deslogar o aluno recém-cadastrado para não travar a navegação do admin
    await supabase.auth.signOut()

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4">
        <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Cadastro Realizado!</h1>
          <p className="text-[#A6A6A6] max-w-xs mx-auto">
            Sua conta foi criada com sucesso. Faça login para acessar seus treinos.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="mt-4 bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold"
          >
            Ir para o Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#BF9004]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#F2B705]/10 blur-[100px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md border-[#585759] bg-[#0D0D0D]/80 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-[#F2B705] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#F2B705]/20">
            <svg className="w-6 h-6 text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Portal do Aluno</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Crie sua conta para acessar seus treinos e evolução.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#A6A6A6]">Nome Completo</Label>
              <Input id="fullName" placeholder="Seu nome completo"
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#A6A6A6]">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(DDD) 99999-9999"
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A6A6A6]">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com"
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#A6A6A6]">Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres"
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit"
              className="w-full h-11 bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold transition-all shadow-lg shadow-[#F2B705]/20 mt-2"
              disabled={loading || !academiaId}>
              {loading ? 'Criando conta...' : 'Finalizar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterAlunoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
      </div>
    }>
      <RegisterAlunoForm />
    </Suspense>
  )
}
