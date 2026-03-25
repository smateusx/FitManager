'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    checkUser()
  }, [])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Painel Administrativo</h1>
            <p className="text-[#A6A6A6] mt-1">
              Bem-vindo de volta ao FitManager, <span className="text-white font-medium">{user?.user_metadata?.nome_completo || 'Administrador'}</span>.
            </p>
          </div>
        </header>

        <main className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-xl p-6 shadow-xl shadow-[#0D0D0D]">
            <h3 className="text-[#A6A6A6] text-sm font-medium uppercase tracking-wider">Alunos Ativos</h3>
            <p className="text-4xl font-bold text-white mt-2">0</p>
          </div>
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-xl p-6 shadow-xl shadow-[#0D0D0D]">
            <h3 className="text-[#A6A6A6] text-sm font-medium uppercase tracking-wider">Vencimentos Próx. 7 Dias</h3>
            <p className="text-4xl font-bold text-[#F2B705] mt-2">0</p>
          </div>
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-xl p-6 shadow-xl shadow-[#0D0D0D]">
            <h3 className="text-[#A6A6A6] text-sm font-medium uppercase tracking-wider">Inadimplentes</h3>
            <p className="text-4xl font-bold text-red-500 mt-2">0</p>
          </div>
        </main>
      </div>
    </div>
  )
}
