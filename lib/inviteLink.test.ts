import { describe, it, expect } from 'vitest'
import { inviteLinkState } from './inviteLink'

const GRANTED = '#access_token=abc&refresh_token=def&type=invite'
const EXPIRED = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'

describe('inviteLinkState', () => {
  it('is ready when the link granted access and the session arrived', () => {
    expect(inviteLinkState({ urlHash: GRANTED, hasSession: true, settled: true })).toBe('ready')
  })

  it('waits while the session is still being established', () => {
    expect(inviteLinkState({ urlHash: GRANTED, hasSession: false, settled: false })).toBe('checking')
  })

  it('reports expired when the link granted access but no session materialised', () => {
    expect(inviteLinkState({ urlHash: GRANTED, hasSession: false, settled: true })).toBe('expired')
  })

  // The 2026-08-04 incident: an admin who was ALREADY signed in clicked an
  // expired invite. Supabase created no new session, so the page saw the
  // admin's own session, showed the form, and the password they typed
  // silently overwrote THEIR OWN account instead of the invited one.
  it('reports expired when the link failed, even though a session exists', () => {
    expect(inviteLinkState({ urlHash: EXPIRED, hasSession: true, settled: true })).toBe('expired')
  })

  // Same danger by a different route: opening the page directly while signed in.
  // A session with no grant in the URL is somebody else's login, never an invite.
  it('never offers the form when the URL granted nothing, session or not', () => {
    expect(inviteLinkState({ urlHash: '', hasSession: true, settled: true })).toBe('expired')
    expect(inviteLinkState({ urlHash: '', hasSession: false, settled: true })).toBe('expired')
  })

  it('treats a failed link as settled immediately, without waiting', () => {
    expect(inviteLinkState({ urlHash: EXPIRED, hasSession: false, settled: false })).toBe('expired')
  })
})
