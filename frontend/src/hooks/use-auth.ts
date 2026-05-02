'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, type Role } from '@/lib/firestore'

export type UserRole = Role | null

export interface UserProfile {
  id: string
  role: UserRole
  academia_id: string | null
  nome_completo: string | null
  telefone: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const p = await getPerfil(u.uid)
        setProfile(
          p
            ? {
                id: p.id,
                role: p.role,
                academia_id: p.academia_id,
                nome_completo: p.nome_completo,
                telefone: p.telefone ?? null,
              }
            : null
        )
      } catch (e) {
        console.error('Erro ao buscar perfil:', e)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'ADMIN',
    isReceptionist: profile?.role === 'RECEPCIONISTA',
    isStudent: profile?.role === 'ALUNO',
  }
}
