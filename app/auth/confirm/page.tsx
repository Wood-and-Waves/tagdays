'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readInviteLink } from '@/lib/inviteLink'
import GoogleSignInButton from '@/app/components/GoogleSignInButton'

type InviteLinkState = 'checking' | 'ready' | 'expired'

function ConfirmForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkState, setLinkState] = useState<InviteLinkState>('checking')

  useEffect(() => {
    const link = readInviteLink(window.location.hash)

    if (link.kind === 'failed') {
      // One screen covers every way a link can fail, which is why the real
      // cause stayed hidden through two debugging sessions. Record which one
      // happened — in the console, never on the page.
      const reason = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      console.error('[auth/confirm] link rejected', {
        error: reason.get('error'),
        error_code: reason.get('error_code'),
        error_description: reason.get('error_description'),
        hadHash: window.location.hash.length > 1,
      })
      setLinkState('expired')
      return
    }

    // Adopt the link's session explicitly. @supabase/ssr's browser client only
    // understands the PKCE flow and silently refuses Supabase's implicit email
    // links, so waiting for it to pick this up would wait forever — and would
    // leave whoever is already signed in as the active session.
    let cancelled = false
    createClient()
      .auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data.session) {
          console.error('[auth/confirm] setSession failed', error?.message ?? 'no session returned')
        }
        setLinkState(error || !data.session ? 'expired' : 'ready')
        // Don't leave credentials sitting in the address bar or history.
        window.history.replaceState(null, '', window.location.pathname)
      })
      // setSession rethrows anything that isn't an AuthError, which would
      // otherwise leave this page on "Verifying..." forever.
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[auth/confirm] setSession threw', err)
        setLinkState('expired')
      })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Never change a password unless this link is what granted the session —
    // otherwise an already-signed-in admin would overwrite their own.
    if (linkState !== 'ready') return

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {linkState === 'expired' ? 'Invite Link Expired' : 'Set Your Password'}
          </h1>
          <p className="text-gray-500 mt-1">HHS Band Boosters Admin</p>
        </div>

        {error && (
          <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {linkState === 'expired' ? (
          <p className="text-center text-gray-600 text-sm leading-relaxed">
            This invite link has expired. Request a new link by sending an email to{' '}
            <a href="mailto:fundraising@huntleybands.com" className="text-brand-700 underline">
              fundraising@huntleybands.com
            </a>.
          </p>
        ) : linkState === 'checking' ? (
          <p className="text-center text-gray-500 text-sm">Verifying your invite link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 text-white font-semibold py-3 rounded-lg hover:bg-brand-800 transition disabled:opacity-50"
            >
              {loading ? 'Setting password...' : 'Set Password & Sign In'}
            </button>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-center text-xs text-gray-500">
              Prefer not to create a password? Use the Google account that matches
              your invited email address.
            </p>
            <GoogleSignInButton label="Sign in with Google instead" />
          </form>
        )}
      </div>
    </main>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmForm />
    </Suspense>
  )
}
