/** Dígitos para wa.me (com código do país 55 quando omitido). */

export function normalizeWhatsAppDigits(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('55')) return d
  if (d.length >= 10 && d.length <= 11) return `55${d}`
  return d
}

export function isValidAcademyWhatsAppDigits(normalized: string): boolean {
  if (!normalized) return false
  const n = normalized.replace(/\D/g, '')
  if (n.startsWith('55')) return n.length >= 12 && n.length <= 13
  return n.length >= 10 && n.length <= 11
}

export function whatsAppChatUrl(normalizedDigits: string): string {
  const d = normalizedDigits.replace(/\D/g, '')
  return `https://wa.me/${d}`
}
