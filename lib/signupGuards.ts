import { verifyFormToken } from './formToken'

export const MIN_FILL_MS = 3000

export type SignupVerdict = { action: 'bot' } | { action: 'duplicate' } | { action: 'ok' }

export function evaluateSignupGuards(input: {
  honeypot?: unknown
  formToken?: unknown
  email: string
  existingEmails: string[]
  now?: number
}): SignupVerdict {
  const now = input.now ?? Date.now()

  // Layer 1: honeypot — real users never fill this hidden field.
  if (typeof input.honeypot === 'string' && input.honeypot.trim() !== '') {
    return { action: 'bot' }
  }

  // Layer 2: signed timing token — invalid signature or submitted impossibly fast.
  const token = typeof input.formToken === 'string' ? input.formToken : ''
  const { valid, elapsedMs } = verifyFormToken(token, now)
  if (!valid || elapsedMs === null || elapsedMs < MIN_FILL_MS) {
    return { action: 'bot' }
  }

  // Layer 3: duplicate email for this slot.
  const email = input.email.trim().toLowerCase()
  const existing = input.existingEmails.map(e => e.trim().toLowerCase())
  if (existing.includes(email)) {
    return { action: 'duplicate' }
  }

  return { action: 'ok' }
}
