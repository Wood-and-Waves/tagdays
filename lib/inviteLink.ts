export type InviteLinkState = 'checking' | 'ready' | 'expired'

/**
 * Decides what the "Set your password" page should show.
 *
 * The URL is the source of truth, not the session. Supabase puts the outcome of
 * the invite link in the hash before the page loads: `#access_token=...` when it
 * granted access, `#error=...` when the link was expired or already used.
 *
 * Reading the session alone is not safe here. On 2026-08-04 an admin who was
 * already signed in clicked an expired invite: Supabase created no new session,
 * so the page saw the admin's own session, showed the form, and the password
 * they typed overwrote THEIR OWN account instead of the invited one. A session
 * that did not come from this link must never unlock the form.
 */
export function inviteLinkState(input: {
  /** window.location.hash, captured before the Supabase client clears it. */
  urlHash: string
  hasSession: boolean
  /** Whether Supabase has reported its startup state at least once. */
  settled: boolean
}): InviteLinkState {
  const params = new URLSearchParams(input.urlHash.replace(/^#/, ''))

  // Supabase told us outright that the link did not work.
  if (params.get('error') || params.get('error_code') || params.get('error_description')) {
    return 'expired'
  }

  // Nothing in the URL granted access, so any session belongs to someone who was
  // already signed in — not to the person this invite was for.
  if (!params.get('access_token')) {
    return 'expired'
  }

  if (input.hasSession) return 'ready'
  return input.settled ? 'expired' : 'checking'
}
