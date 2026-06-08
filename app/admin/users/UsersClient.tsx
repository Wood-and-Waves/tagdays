'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersClient({ users }: { users: any[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(`Invite sent to ${email}`)
    setEmail('')
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async (id: string, userEmail: string) => {
    if (!confirm(`Remove admin access for ${userEmail}? This cannot be undone.`)) return
    setDeleting(id)

    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Something went wrong.')
      setDeleting(null)
      return
    }

    router.refresh()
    setDeleting(null)
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 max-w-md">
        <h2 className="font-bold text-lg text-gray-900 mb-1">Invite Admin User</h2>
        <p className="text-sm text-gray-500 mb-4">
          They will receive an email with a link to set their own password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@huntleybands.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Sign In</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{user.email}</td>
                <td className="px-4 py-3">
                  {user.invited_at && !user.last_sign_in_at ? (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Invited
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('en-US')}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US')
                    : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    disabled={deleting === user.id}
                    className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                  >
                    {deleting === user.id ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
