'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterAlunoPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const academiaId = searchParams.get('academia_id')
  const router = useRouter()

  useEffect(() => {
    if (!academiaId) {
      alert("Link de convite inválido ou ausente. Peça um novo link à sua academia.")
    }
  }, [academiaId])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) {
      alert('Academia não identificada no link de convite.')
      return
    }

    setLoading(true)
    
    // 1. Criar a conta no auth.users (Gatilho fará ele nascer como ALUNO com academia_id nulo no perfis)
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

    // 2. Atualizar a tabela perfis para vincular à academia correta e adicionar telefone
    if (authData.user) {
      const { error: updateError } = await supabase
        .from('perfis')
        .update({
          academia_id: academiaId,
          telefone: phone
        })
        .eq('id', authData.user.id)
        
      if (updateError) {
        alert('Conta foi criada, porém houve um erro ao vincular à academia: ' + updateError.message)
      } else {
        alert('Cadastro realizado com sucesso! Você já pode usar o painel do Aluno.')
        // Por ser aluno, poderíamos redirecionar para um dashboard específico de Aluno
        // No momento, se ele for para /dashboard, o layout do Admin vai rodar, precisamos tratar isso futuramente.
        // Mas o MVP de cadastro está concluído.
        router.push('/')
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4 relative overflow-hidden">
      {/* Background gradients */}
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
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#A6A6A6]">Nome Completo</Label>
              <Input 
                id="fullName" 
                placeholder="Seu nome" 
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#A6A6A6]">Telefone / WhatsApp</Label>
              <Input 
                id="phone" 
                placeholder="(DDD) 99999-9999" 
                className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-11"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A6A6A6]">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
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
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold transition-all shadow-lg shadow-[#F2B705]/20 mt-2"
              disabled={loading || !academiaId}
            >
              {loading ? 'Criando...' : 'Finalizar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
