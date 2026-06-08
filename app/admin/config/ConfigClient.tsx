'use client'

import { useState } from 'react'
import { AdminConfig } from '@/lib/types'

export default function ConfigClient({ config }: { config: AdminConfig }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    reminder_1_hours_before: config.reminder_1_hours_before,
    reminder_2_hours_before: config.reminder_2_hours_before,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-2">Reminder Settings</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure when reminder emails and SMS messages are sent before each shift.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">
            Settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Reminder — Hours Before Shift
            </label>
            <input
              type="number"
              min={1}
              max={168}
              required
              value={form.reminder_1_hours_before}
              onChange={e => setForm({ ...form, reminder_1_hours_before: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Currently: {form.reminder_1_hours_before} hours ({Math.round(form.reminder_1_hours_before / 24)} days) before shift
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Second Reminder — Hours Before Shift
            </label>
            <input
              type="number"
              min={1}
              max={168}
              required
              value={form.reminder_2_hours_before}
              onChange={e => setForm({ ...form, reminder_2_hours_before: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Currently: {form.reminder_2_hours_before} hours ({form.reminder_2_hours_before < 24 ? `${form.reminder_2_hours_before} hours` : `${Math.round(form.reminder_2_hours_before / 24)} days`}) before shift
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
