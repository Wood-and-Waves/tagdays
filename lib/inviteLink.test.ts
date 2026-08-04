import { describe, it, expect } from 'vitest'
import { inviteLinkState } from './inviteLink'

describe('inviteLinkState', () => {
  it('is ready once a session exists', () => {
    expect(inviteLinkState('SIGNED_IN', true)).toBe('ready')
    expect(inviteLinkState('INITIAL_SESSION', true)).toBe('ready')
  })

  // The actual bug: INITIAL_SESSION fires even when there is NO session, and the
  // page used to treat that as "ready" — showing a password form that could only
  // ever fail with "Auth session missing!".
  it('reports an expired link when startup finishes with no session', () => {
    expect(inviteLinkState('INITIAL_SESSION', false)).toBe('expired')
  })

  it('stays in checking while startup has not reported yet', () => {
    expect(inviteLinkState('TOKEN_REFRESHED', false)).toBe('checking')
    expect(inviteLinkState('SIGNED_OUT', false)).toBe('checking')
  })
})
