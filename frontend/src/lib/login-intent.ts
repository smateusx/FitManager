export type LoginIntent = 'admin' | 'recepcionista' | 'aluno'

const KEY = 'fitmanager_login_intent'

export function setLoginIntent(intent: LoginIntent): void {
  try {
    sessionStorage.setItem(KEY, intent)
  } catch {
    /* ignore */
  }
}

export function getLoginIntent(): LoginIntent | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v === 'admin' || v === 'recepcionista' || v === 'aluno') return v
  } catch {
    /* ignore */
  }
  return null
}

export function clearLoginIntent(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
