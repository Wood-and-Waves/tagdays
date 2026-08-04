export type InviteLinkResult =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'failed' }

/**
 * Reads the session Supabase handed back on an email link (invite, recovery,
 * magic link) from the URL fragment.
 *
 * This exists because @supabase/ssr's browser client is hardcoded to the PKCE
 * flow, while Supabase's email links use the implicit flow — the client throws
 * "Not a valid PKCE flow url" internally, swallows it, and creates no session
 * at all. The page therefore adopts the session itself via setSession().
 *
 * Returning 'failed' for anything other than a complete token pair is the
 * safety property that matters: without it the page would fall back to whoever
 * happened to be signed in already, and setting a password would overwrite
 * THEIR account. That is exactly how an admin locked themselves out on
 * 2026-08-04.
 */
export function readInviteLink(urlHash: string): InviteLinkResult {
  const params = new URLSearchParams(urlHash.replace(/^#/, ''))

  // Supabase says outright that the link did not work.
  if (params.get('error') || params.get('error_code') || params.get('error_description')) {
    return { kind: 'failed' }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return { kind: 'failed' }

  return { kind: 'tokens', accessToken, refreshToken }
}
