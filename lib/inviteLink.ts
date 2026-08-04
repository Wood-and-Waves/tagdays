export type InviteLinkState = 'checking' | 'ready' | 'expired'

/**
 * Decides what the "Set your password" page should show.
 *
 * Supabase fires INITIAL_SESSION once on startup whether or not a session was
 * recovered from the URL. Treating that event alone as success is what made an
 * expired invite render a password form that could only fail with the unhelpful
 * "Auth session missing!" — so the session itself has to be the deciding factor.
 */
export function inviteLinkState(event: string, hasSession: boolean): InviteLinkState {
  if (hasSession) return 'ready'
  // Startup finished and still no session: the link was never valid, has already
  // been used, or has expired.
  if (event === 'INITIAL_SESSION') return 'expired'
  return 'checking'
}
