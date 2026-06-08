'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupsClient({ signups }: { signups: any[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this signup? The slot will open back up.')) return
    setLoading(id)
    await fetch('/api/admin/signups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, cancelled: true }),
    })
    router.refresh()
    setLoading(null)
  }

  const handleRestore = async (id: string) => {
    setLoading(id)
    await fetch('/api/admin/signups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, cancelled: false }),
    })
    router.refresh()
    setLoading(null)
  }

  const filtered = signups.filter(s => {
    const search = filter.toLowerCase()
    return (
      s.first_name.toLowerCase().includes(search) ||
      s.last_name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search) ||
      s.slot?.location?.name.toLowerCase().includes(search)
    )
  })

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or location..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="mb-4">
        <a href="/api/admin/export" className="inline-block bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-semibold text-sm">Export CSV</a>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Reminder</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(signup => (
              <tr key={signup.id} className={`border-b border-gray-100 hover:bg-gray-50 ${signup.cancelled ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{signup.first_name} {signup.last_name}</td>
                <td className="px-4 py-3 text-gray-700 capitalize">{signup.role}</td>
                <td className="px-4 py-3 text-gray-700">{signup.slot?.location?.name || '-'}</td>
                <td className="px-4 py-3 text-gray-700">
                  {signup.slot?.date ? new Date(signup.slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-'}
                </td>
                <td className="px-4 py-3 text-gray-700">{signup.slot?.start_time?.slice(0,5)} - {signup.slot?.end_time?.slice(0,5)}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{signup.email}</div>
                  {signup.phone && <div className="text-gray-400">{signup.phone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-700 capitalize">{signup.reminder_preference}</td>
                <td className="px-4 py-3">
                  {signup.cancelled ? (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">Cancelled</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {signup.cancelled ? (
                    <button onClick={() => handleRestore(signup.id)} disabled={loading === signup.id} className="text-blue-600 hover:text-blue-800 font-medium">Restore</button>
                  ) : (
                    <button onClick={() => handleCancel(signup.id)} disabled={loading === signup.id} className="text-red-600 hover:text-red-800 font-medium">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}