'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { inviteLinkState, type InviteLinkState } from '@/lib/inviteLink'

function ConfirmForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [urlHash, setUrlHash] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    // Read the hash BEFORE creating the client — Supabase strips it from the
    // address bar as it starts up, and it is the only trustworthy record of
    // whether this particular link granted access.
    setUrlHash(window.location.hash)

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(prev => prev || !!session)
      setSettled(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const linkState: InviteLinkState =
    urlHash === null ? 'checking' : inviteLinkState({ urlHash, hasSession, settled })

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
