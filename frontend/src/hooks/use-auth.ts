'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'

export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'ALUNO' | null

export interface UserProfile {
  id: string
  role: UserRole
  academia_id: string | null
  nome_completo: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}

    async function initAuthListener() {
      try {
        const auth = getFirebaseAuth()
        const db = getFirebaseDb()

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }

          setUser(firebaseUser)
          await fetchProfile(db, firebaseUser.uid, firebaseUser.displayName)
        })
      } catch (error) {
        console.error('Erro ao iniciar autenticação Firebase:', error)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    initAuthListener()

    return () => unsubscribe()
  }, [])

  async function fetchProfile(
    db: ReturnType<typeof getFirebaseDb>,
    userId: string,
    displayName: string | null
  ) {
    try {
      const profileRef = doc(db, 'perfis', userId)
      const profileSnap = await getDoc(profileRef)

      if (!profileSnap.exists()) {
        setProfile({
          id: userId,
          role: null,
          academia_id: null,
          nome_completo: displayName,
          avatar_url: null,
        })
        return
      }

      const data = profileSnap.data()
      setProfile({
        id: userId,
        role: (data.role as UserRole) ?? null,
        academia_id: (data.academia_id as string | null) ?? null,
        nome_completo: (data.nome_completo as string | null) ?? displayName,
        avatar_url: (data.avatar_url as string | null) ?? null,
      })
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      setProfile({
        id: userId,
        role: null,
        academia_id: null,
        nome_completo: displayName,
        avatar_url: null,
      })
    } finally {
      setLoading(false)
    }
  }

  return { user, profile, loading, isAdmin: profile?.role === 'ADMIN', isReceptionist: profile?.role === 'RECEPCIONISTA', isStudent: profile?.role === 'ALUNO' }
}
