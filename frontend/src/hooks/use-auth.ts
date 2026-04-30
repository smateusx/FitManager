'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'ALUNO' | null

export interface UserProfile {
  id: string
  role: UserRole
  academia_id: string | null
  nome_completo: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event: string, session: { user: { id: string } } | null) => {
          if (session) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    getSession()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  return { user, profile, loading, isAdmin: profile?.role === 'ADMIN', isReceptionist: profile?.role === 'RECEPCIONISTA', isStudent: profile?.role === 'ALUNO' }
}
