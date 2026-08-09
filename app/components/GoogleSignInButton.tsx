'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Starts Google sign-in.
 *
 * Must stay in a client component: the PKCE code verifier is written by the
 * browser client, and a Server Component's cookie writes are discarded (see the
 * catch in lib/supabase/server.ts), which would leave the callback unable to
 * complete the exchange.
 *
 * redirectTo is built from window.location.origin rather than
 * NEXT_PUBLIC_SITE_URL so it is always correct on localhost, previews and
 * production without depending on that variable being right.
 */
export default function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    // Only reached if the redirect never happens; on success the browser leaves.
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
        </svg>
        {loading ? 'Redirecting…' : label}
      </button>

      {error && (
        <p className="mt-2 text-center text-brand-700 text-sm">{error}</p>
      )}
    </div>
  )
}
