"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [gymName, setGymName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 1. Criar a conta de autenticação (Gatilho fará ele nascer como ALUNO com academia_id null)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome_completo: fullName } }
    })

    if (authError) {
      alert('Erro ao criar conta: ' + authError.message)
      setLoading(false)
      return
    }

    // Como no Supabase o login automático acontece após o signup, o usuário já estará "logado" nesta sessão.
    // 2. Criar a academia no banco de dados
    const { data: gymData, error: gymError } = await supabase
      .from('academias')
      .insert({ nome: gymName })
      .select()
      .single()

    if (gymError) {
      alert('Conta criada, mas erro ao registrar a academia. Contate o suporte.')
    } else if (gymData && authData.user) {
      // 3. Elevar os privilégios do usuário recém-criado para ADMIN da sua própria academia
      await supabase.from('perfis').update({
        academia_id: gymData.id,
        role: 'ADMIN'
      }).eq('id', authData.user.id)
      
      alert('Conta de academia criada com sucesso!')
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4 relative overflow-hidden">
      {/* Background gradients using brand colors */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#BF9004]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#F2B705]/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="w-full max-w-lg border-[#585759] bg-[#0D0D0D]/80 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-[#F2B705] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#F2B705]/20">
            <svg className="w-6 h-6 text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Cadastre sua Academia</CardTitle>
          <CardDescription className="text-[#A6A6A6]">
            Crie sua conta administrativa e comece a gerenciar seus alunos com o FitManager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="gymName" className="text-[#A6A6A6]">Nome da Academia</Label>
              <Input 
                id="gymName" 
                placeholder="Ex: FitTech GYM" 
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#A6A6A6]">Seu Nome Completo</Label>
              <Input 
                id="fullName" 
                placeholder="João Silva" 
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#A6A6A6]">E-mail Comercial</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@academia.com" 
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#A6A6A6]">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold transition-all shadow-lg shadow-[#F2B705]/20 mt-2"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar minha conta gratuita'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-[#585759]/50 mt-4">
          <div className="text-sm text-center text-[#A6A6A6]">
            Já possui uma conta?{' '}
            <Link href="/login" className="font-semibold text-[#F2B705] hover:text-[#BF9004] transition-colors">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
