import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from 'firebase/auth'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function shouldPreferRedirect(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
}

const POPUP_FALLBACK_TO_REDIRECT_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
])

function readAuthCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string') {
    return (err as { code: string }).code
  }
  return ''
}

let redirectResultInFlight: Promise<UserCredential | null> | null = null

/**
 * Consome o resultado de signInWithRedirect ao voltar à app.
 * Partilha a mesma Promise entre chamadas paralelas (ex.: React Strict Mode).
 */
export function consumeGoogleRedirectResult(auth: Auth): Promise<UserCredential | null> {
  if (!redirectResultInFlight) {
    redirectResultInFlight = getRedirectResult(auth).finally(() => {
      redirectResultInFlight = null
    })
  }
  return redirectResultInFlight
}

/**
 * Popup funciona bem na maioria dos desktops; em mobile e alguns browsers falha.
 * Nesses casos usa-se redirect, que é suportado em qualquer browser moderno.
 *
 * @returns credencial após popup bem-sucedido; null se foi iniciado redirect (a página navega para o Google)
 */
export async function signInWithGoogle(auth: Auth): Promise<UserCredential | null> {
  if (shouldPreferRedirect()) {
    await signInWithRedirect(auth, googleProvider)
    return null
  }
  try {
    return await signInWithPopup(auth, googleProvider)
  } catch (err) {
    const code = readAuthCode(err)
    if (POPUP_FALLBACK_TO_REDIRECT_CODES.has(code)) {
      await signInWithRedirect(auth, googleProvider)
      return null
    }
    throw err
  }
}
