/**
 * Base URL for the FitManager API (Render). Set in Vercel:
 * NEXT_PUBLIC_API_URL=https://your-service.onrender.com
 */
const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''

export const apiBaseUrl = raw.replace(/\/+$/, '')

/** Absolute URL for an API path, e.g. apiUrl('/health') */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!apiBaseUrl) return p
  return `${apiBaseUrl}${p}`
}
