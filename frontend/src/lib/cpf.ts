/** Mantém só dígitos. */
export function normalizeCpfDigits(input: string): string {
  return input.replace(/\D/g, '')
}

/** Formata para exibição: 000.000.000-00 */
export function formatCpfDisplay(digits: string): string {
  const d = normalizeCpfDigits(digits)
  if (d.length !== 11) return digits
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/**
 * Valida CPF brasileiro (11 dígitos, não sequência óbvia, dígitos verificadores).
 */
export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpfDigits(input)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]!, 10) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(cpf[9]!, 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]!, 10) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  if (d2 !== parseInt(cpf[10]!, 10)) return false

  return true
}
