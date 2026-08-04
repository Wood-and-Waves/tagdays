export type InviteLinkState = 'checking' | 'ready' | 'expired'

/**
 * Decides what the "Set your password" page should show.
 *
 * Setting a password acts on whoever is currently signed in, so the only safe
 * rule is: the live session must be the exact one this link delivered. The hash
 * Supabase puts on the URL carries that session's access token, so comparing it
 * against the live session proves they are the same one — no guessing from
 * event names, no race with startup order.
 *
 * Two incidents on 2026-08-04 came from getting this wrong. An admin who was
 * already signed in clicked an invite; the password they typed was applied to
 * their own account, locking them out, while the invited account got nothing.
 */
export function inviteLinkState(input: {
  /** window.location.hash, captured before the Supabase client clears it. */
  urlHash: string
  /** access_token of the live session, or null if there is none yet. */
  sessionAccessToken: string | null
  /** Whether Supabase has reported its startup state at least once. */
  settled: boolean
}): InviteLinkState {
  const params = new URLSearchParams(input.urlHash.replace(/^#/, ''))

  // Supabase told us outright that the link did not work.
  if (params.get('error') || params.get('error_code') || params.get('error_description')) {
    return 'expired'
  }

  const linkToken = params.get('access_token')

  // Nothing in the URL granted access, so any session belongs to someone who was
  // already signed in — not to the person this invite was for.
  if (!linkToken) return 'expired'

  // The session must be the one this link delivered, not one already in the browser.
  if (input.sessionAccessToken === linkToken) return 'ready'

  return input.settled ? 'expired' : 'checking'
}
