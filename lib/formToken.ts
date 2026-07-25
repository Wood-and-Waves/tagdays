import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(secret?: string): string {
  const s = secret ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('formToken: missing signing secret (SUPABASE_SERVICE_ROLE_KEY)')
  return s
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

// Issues `base64url(issuedAtMs).hex(hmac)`.
export function issueFormToken(now: number = Date.now(), secret?: string): string {
  const payload = Buffer.from(String(now)).toString('base64url')
  return `${payload}.${sign(payload, getSecret(secret))}`
}

// Verifies the signature and returns how long ago the token was issued.
// Never throws on malformed input — returns { valid: false, elapsedMs: null }.
export function verifyFormToken(
  token: string,
  now: number = Date.now(),
  secret?: string
): { valid: boolean; elapsedMs: number | null } {
  if (typeof token !== 'string' || token.length === 0) return { valid: false, elapsedMs: null }
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false, elapsedMs: null }
  const [payload, providedSig] = parts

  let expectedSig: string
  try {
    expectedSig = sign(payload, getSecret(secret))
  } catch {
    return { valid: false, elapsedMs: null }
  }

  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, elapsedMs: null }

  const issuedAt = Number(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!Number.isFinite(issuedAt)) return { valid: false, elapsedMs: null }

  return { valid: true, elapsedMs: now - issuedAt }
}
