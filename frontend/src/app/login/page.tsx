'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Erro ao fazer login: ' + error.message)
      setLoading(false)
    } else if (data.user) {
      // Verificar o role do usuário para redirecionar corretamente
      const { data: perfil } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (perfil?.role === 'ALUNO') {
        router.push('/meu-treino')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4 relative overflow-hidden">
      {/* Background gradients using brand colors */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[400px] -translate-x-1/2 bg-[#F2B705]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-[#BF9004]/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="w-full max-w-md border-[#585759] bg-[#0D0D0D]/80 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-[#F2B705] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#F2B705]/20">
            <svg className="w-6 h-6 text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-[#A6A6A6]">Entre na sua conta FitManager para acessar sua academia ou treinos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#A6A6A6]">Senha</Label>
                <Link href="#" className="text-sm font-medium text-[#F2B705] hover:text-[#BF9004] transition-colors">Esqueceu a senha?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-[#0D0D0D] border-[#585759] text-white focus-visible:ring-[#F2B705] h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold transition-all shadow-lg shadow-[#F2B705]/20"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-[#585759]/50 mt-2">
          <div className="text-sm text-center text-[#A6A6A6]">
            É novo e não tem conta?{' '}
            <Link href="/register" className="font-semibold text-[#F2B705] hover:text-[#BF9004] transition-colors">
              Cadastre-se grátis
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
