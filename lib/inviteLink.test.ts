import { describe, it, expect } from 'vitest'
import { inviteLinkState } from './inviteLink'

const GRANTED = '#access_token=THE-LINKS-TOKEN&refresh_token=def&type=invite'
const EXPIRED = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'

describe('inviteLinkState', () => {
  it('is ready only when the live session is the one the link delivered', () => {
    expect(inviteLinkState({
      urlHash: GRANTED, sessionAccessToken: 'THE-LINKS-TOKEN', settled: true,
    })).toBe('ready')
  })

  // The whole point: a session that did not come from this link must never
  // unlock the form, or the password overwrites whoever is already signed in.
  it('refuses when a different session is live than the link delivered', () => {
    expect(inviteLinkState({
      urlHash: GRANTED, sessionAccessToken: 'SOMEONE-ELSES-TOKEN', settled: true,
    })).toBe('expired')
  })

  it('waits while the session is still being established', () => {
    expect(inviteLinkState({
      urlHash: GRANTED, sessionAccessToken: null, settled: false,
    })).toBe('checking')
  })

  it('reports expired when the link granted access but no session materialised', () => {
    expect(inviteLinkState({
      urlHash: GRANTED, sessionAccessToken: null, settled: true,
    })).toBe('expired')
  })

  // 2026-08-04 incident: an already-signed-in admin clicked an expired invite.
  // No new session was created, so the page saw the admin's own session and the
  // password they typed overwrote their own account.
  it('reports expired when the link failed, even though a session exists', () => {
    expect(inviteLinkState({
      urlHash: EXPIRED, sessionAccessToken: 'ADMINS-OWN-TOKEN', settled: true,
    })).toBe('expired')
  })

  it('never offers the form when the URL granted nothing', () => {
    expect(inviteLinkState({ urlHash: '', sessionAccessToken: 'ADMINS-OWN-TOKEN', settled: true })).toBe('expired')
    expect(inviteLinkState({ urlHash: '', sessionAccessToken: null, settled: true })).toBe('expired')
  })

  it('treats a failed link as settled immediately, without waiting', () => {
    expect(inviteLinkState({ urlHash: EXPIRED, sessionAccessToken: null, settled: false })).toBe('expired')
  })
})
