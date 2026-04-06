'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading, isAdmin, isReceptionist } = useAuth()
  
  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
    // Redirecionar alunos que tentarem acessar a dashboard administrativa
    if (!loading && profile?.role === 'ALUNO') {
      router.push('/meu-treino')
    }
  }, [loading, profile, router])

  const navItems = [
    { href: '/dashboard', label: 'Início', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { href: '/alunos', label: 'Alunos', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: '/treinos', label: 'Fichas de Treino', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: '/planos', label: 'Planos & Pagamentos', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { href: '/cobrancas', label: 'Cobranças', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F2B705]"></div>
      </div>
    )
  }

  if (!profile || profile.role === 'ALUNO') {
    return null // O useEffect lidará com o redirecionamento
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#585759]/30 bg-[#0D0D0D] flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-[#585759]/20">
          <h1 className="text-2xl font-black text-[#F2B705] tracking-tighter">FitManager<span className="text-white">.</span></h1>
          {isReceptionist && (
            <span className="text-[10px] bg-[#F2B705] text-[#0D0D0D] px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 inline-block">Recepcionista</span>
          )}
          {isAdmin && (
            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 inline-block">Admin</span>
          )}
        </div>
        
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-widest text-[#585759] font-bold">Menu Principal</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                  ? 'bg-[#F2B705] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20' 
                  : 'text-[#A6A6A6] hover:bg-[#585759]/20 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#585759]/30 space-y-2">
          <Link 
            href="/perfil"
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/perfil' 
              ? 'bg-[#F2B705]/10 text-[#F2B705] font-bold border border-[#F2B705]/30' 
              : 'text-[#A6A6A6] hover:bg-[#585759]/20 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#585759]/30 overflow-hidden border border-[#585759]/50">
               {profile.avatar_url ? (
                 <img src={profile.avatar_url} alt={profile.nome_completo || ''} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#A6A6A6]">
                   {profile.nome_completo?.[0] || 'U'}
                 </div>
               )}
            </div>
            <span className="flex-1 truncate text-sm">{profile.nome_completo || 'Meu Perfil'}</span>
          </Link>

          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-[#A6A6A6] hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#0D0D0D]">
        {children}
      </main>
    </div>
  )
}
