import { describe, it, expect } from 'vitest'
import { readInviteLink } from './inviteLink'

describe('readInviteLink', () => {
  it('extracts both tokens from a link that granted access', () => {
    const r = readInviteLink('#access_token=AAA&refresh_token=BBB&expires_in=3600&type=recovery')
    expect(r).toEqual({ kind: 'tokens', accessToken: 'AAA', refreshToken: 'BBB' })
  })

  it('reports failure when Supabase returned an error', () => {
    const r = readInviteLink('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    expect(r).toEqual({ kind: 'failed' })
  })

  // Opening the page directly. There is nothing to adopt, so the form must not
  // appear — otherwise the password would land on whoever is already signed in,
  // which is how an admin locked themselves out on 2026-08-04.
  it('reports failure when the page was opened without a link', () => {
    expect(readInviteLink('')).toEqual({ kind: 'failed' })
    expect(readInviteLink('#')).toEqual({ kind: 'failed' })
  })

  it('reports failure when the pair is incomplete', () => {
    expect(readInviteLink('#access_token=AAA')).toEqual({ kind: 'failed' })
    expect(readInviteLink('#refresh_token=BBB')).toEqual({ kind: 'failed' })
  })

  it('ignores a leading hash and tolerates junk', () => {
    expect(readInviteLink('access_token=AAA&refresh_token=BBB')).toEqual({
      kind: 'tokens', accessToken: 'AAA', refreshToken: 'BBB',
    })
    expect(readInviteLink('#not-a-query-string')).toEqual({ kind: 'failed' })
  })
})
