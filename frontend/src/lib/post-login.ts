import type { User } from 'firebase/auth'
import { getPerfil } from '@/lib/firestore'

/**
 * Após login/registo bem-sucedido: e-mail verificado, perfil com CPF, e rota por papel.
 */
export async function resolvePostLoginPath(user: User): Promise<string> {
  if (!user.emailVerified) return '/verificar-email'

  const p = await getPerfil(user.uid)
  if (!p?.cpf) return '/completar-cadastro'

  if (p.role === 'ALUNO') return '/meu-treino'
  return '/dashboard'
}
