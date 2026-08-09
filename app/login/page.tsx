'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GoogleSignInButton from '@/app/components/GoogleSignInButton'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // The Google callback reports failures back here.
  useEffect(() => {
    const code = searchParams.get('error')
    if (!code) return

    // Supabase refuses an unknown Google account with "Signups not allowed for
    // this instance", and our own callback refuses one with no invite. Both mean
    // the same thing to the person reading it, so say it the same plain way
    // rather than leaking either bit of machinery.
    const notInvited =
      code === 'not_invited' || /signups? not allowed/i.test(code)

    setError(
      notInvited
        ? "That Google account hasn't been invited yet. Ask an admin to add you first."
        : code
    )
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Keep the familiar wording for a genuinely wrong email or password, but
      // show anything else verbatim. Reporting every failure as bad credentials
      // is what made a lockout on 2026-08-04 so hard to diagnose.
      setError(
        error.message.toLowerCase().includes('invalid login credentials')
          ? 'Invalid email or password.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tag Days Admin</h1>
          <p className="text-gray-500 mt-1">Huntley High School Band Boosters</p>
        </div>

        {error && (
          <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <GoogleSignInButton />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 text-white font-semibold py-3 rounded-lg hover:bg-brand-800 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
