import { describe, it, expect, beforeAll } from 'vitest'
import { evaluateSignupGuards } from './signupGuards'
import { issueFormToken } from './formToken'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret-key'
})

const goodToken = (issuedAt: number) => issueFormToken(issuedAt)

describe('evaluateSignupGuards', () => {
  it('flags a filled honeypot as bot (before anything else)', () => {
    const v = evaluateSignupGuards({
      honeypot: 'http://spam.example',
      formToken: goodToken(0),
      email: 'a@b.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a missing/invalid token as bot', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: 'garbage',
      email: 'a@b.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a too-fast submit (< 3000ms) as bot', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: 'a@b.com',
      existingEmails: [],
      now: 2000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a duplicate email for the slot (case-insensitive)', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: '  Jane@Example.com ',
      existingEmails: ['jane@example.com'],
      now: 10_000,
    })
    expect(v.action).toBe('duplicate')
  })

  it('returns ok for a human-paced, unique, honeypot-empty submit', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: 'new@person.com',
      existingEmails: ['someone@else.com'],
      now: 10_000,
    })
    expect(v.action).toBe('ok')
  })

  it('does not treat an empty honeypot (undefined) as a bot', () => {
    const v = evaluateSignupGuards({
      formToken: goodToken(0),
      email: 'x@y.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('ok')
  })
})
