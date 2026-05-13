import type { User } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getPerfil, type Role } from '@/lib/firestore'
import { clearLoginIntent, getLoginIntent } from '@/lib/login-intent'

export type ResolvePostLoginResult =
  | { ok: true; path: string }
  | { ok: false; message: string }

/**
 * Após login/registo: e-mail verificado → perfil com CPF → destino por papel.
 * Se existir intent de portal (/login/academia|recepcionista|aluno), valida contra o role no Firestore.
 */
export async function resolvePostLogin(user: User): Promise<ResolvePostLoginResult> {
  if (!user.emailVerified) {
    return { ok: true, path: '/verificar-email' }
  }

  const p = await getPerfil(user.uid)
  if (!p?.cpf) {
    return { ok: true, path: '/completar-cadastro' }
  }

  const intent = getLoginIntent()
  const role = p.role as Role

  if (intent === 'admin' && role !== 'ADMIN') {
    await signOut(getFirebaseAuth())
    clearLoginIntent()
    return {
      ok: false,
      message:
        'Esta conta não é de administrador da academia. Use o login «Aluno» ou «Receção», conforme o seu caso.',
    }
  }
  if (intent === 'recepcionista' && role !== 'RECEPCIONISTA') {
    await signOut(getFirebaseAuth())
    clearLoginIntent()
    return {
      ok: false,
      message:
        'Esta conta não é de recepcionista. Dono da academia: login «Academia». Aluno: login «Aluno».',
    }
  }
  if (intent === 'aluno' && role !== 'ALUNO') {
    await signOut(getFirebaseAuth())
    clearLoginIntent()
    return {
      ok: false,
      message:
        'Esta conta é da equipa da academia (dono ou receção). Use «Academia» ou «Receção» para entrar.',
    }
  }

  clearLoginIntent()

  if (role === 'ALUNO') return { ok: true, path: '/meu-treino' }
  return { ok: true, path: '/dashboard' }
}
