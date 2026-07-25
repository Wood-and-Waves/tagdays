import { describe, it, expect, beforeAll } from 'vitest'
import { issueFormToken, verifyFormToken } from './formToken'

const SECRET = 'test-secret-key'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = SECRET
})

describe('formToken', () => {
  it('round-trips: a freshly issued token verifies as valid', () => {
    const t0 = 1_000_000
    const token = issueFormToken(t0)
    const res = verifyFormToken(token, t0 + 5000)
    expect(res.valid).toBe(true)
    expect(res.elapsedMs).toBe(5000)
  })

  it('computes elapsedMs from issued-at to now', () => {
    const token = issueFormToken(1000)
    expect(verifyFormToken(token, 4000).elapsedMs).toBe(3000)
  })

  it('rejects a tampered signature', () => {
    const token = issueFormToken(1000)
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa')
    const res = verifyFormToken(tampered, 5000)
    expect(res.valid).toBe(false)
  })

  it('rejects a token whose payload was swapped (signature no longer matches)', () => {
    const token = issueFormToken(1000)
    const sig = token.split('.')[1]
    const forgedPayload = Buffer.from(String(9999)).toString('base64url')
    const res = verifyFormToken(`${forgedPayload}.${sig}`, 5000)
    expect(res.valid).toBe(false)
  })

  it('rejects garbage / malformed tokens without throwing', () => {
    expect(verifyFormToken('', 5000).valid).toBe(false)
    expect(verifyFormToken('no-dot-here', 5000).valid).toBe(false)
    expect(verifyFormToken('a.b.c', 5000).valid).toBe(false)
  })

  it('is signed with the secret — a different secret does not verify', () => {
    const token = issueFormToken(1000, 'secret-A')
    expect(verifyFormToken(token, 5000, 'secret-B').valid).toBe(false)
  })
})
