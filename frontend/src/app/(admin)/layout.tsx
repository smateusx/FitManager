'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import Link from 'next/link'
import { ProfileAvatar } from '@/components/profile-avatar'
import { Menu, X } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, user, loading, isAdmin, isReceptionist } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.emailVerified) {
      router.push('/verificar-email')
      return
    }
    if (!profile?.cpf) {
      router.push('/completar-cadastro')
      return
    }
    if (profile.role === 'ALUNO') {
      router.push('/meu-treino')
    }
  }, [loading, profile, user, router])

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

  if (!profile || profile.role === 'ALUNO' || !profile.cpf) {
    return null
  }

  const sidebar = (
    <>
      <div className="p-5 sm:p-6 border-b border-[#585759]/20 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href="/" className="inline-block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2B705]">
              <h1 className="text-xl sm:text-2xl font-black text-[#F2B705] tracking-tighter">
                FitManager<span className="text-white">.</span>
              </h1>
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {isReceptionist && (
                <span className="text-[10px] bg-[#F2B705] text-[#0D0D0D] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Recepção
                </span>
              )}
              {isAdmin && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-[#A6A6A6] hover:bg-[#585759]/20 hover:text-white"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-3 shrink-0">
        <p className="text-[11px] uppercase tracking-widest text-[#585759] font-bold">Menu</p>
      </div>

      <nav className="flex-1 px-3 sm:px-4 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#F2B705] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20'
                  : 'text-[#A6A6A6] hover:bg-[#585759]/20 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isActive ? 2.5 : 2}
                  d={item.icon}
                />
              </svg>
              <span className="text-sm sm:text-base">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-[#585759]/30 space-y-1 shrink-0">
        <Link
          href="/perfil"
          onClick={() => setMobileNavOpen(false)}
          className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
            pathname === '/perfil'
              ? 'bg-[#F2B705]/10 text-[#F2B705] font-bold border border-[#F2B705]/30'
              : 'text-[#A6A6A6] hover:bg-[#585759]/20 hover:text-white'
          }`}
        >
          <ProfileAvatar
            fotoUrl={profile.foto_url}
            name={profile.nome_completo || 'Perfil'}
            sizeClass="h-8 w-8 text-[10px] border border-[#F2B705]/35"
          />
          <span className="flex-1 truncate text-sm">{profile.nome_completo || 'Perfil'}</span>
        </Link>

        <button
          type="button"
          onClick={async () => {
            await signOut(getFirebaseAuth())
            router.push('/login')
          }}
          className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[#A6A6A6] hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0D0D0D] text-white flex flex-col lg:flex-row">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 border-b border-[#585759]/30 bg-[#0D0D0D]/95 backdrop-blur-md">
        <Link
          href="/"
          className="font-black text-[#F2B705] tracking-tighter text-lg rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2B705]"
        >
          FitManager<span className="text-white">.</span>
        </Link>
        <button
          type="button"
          className="p-2 rounded-lg text-white bg-[#585759]/25 border border-[#585759]/40"
          onClick={() => setMobileNavOpen(true)}
          aria-expanded={mobileNavOpen}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[min(18rem,88vw)] max-w-[18rem] border-r border-[#585759]/30 bg-[#0D0D0D] flex flex-col shadow-2xl transform transition-transform duration-200 ease-out lg:translate-x-0 lg:max-w-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebar}
      </aside>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0D0D0D] min-w-0">{children}</main>
    </div>
  )
}
