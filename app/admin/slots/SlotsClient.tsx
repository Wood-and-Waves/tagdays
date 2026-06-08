'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Location, SlotWithSignups } from '@/lib/types'

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
]

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function SlotsClient({
  slots,
  locations,
}: {
  slots: SlotWithSignups[]
  locations: Location[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'none' | 'single' | 'bulk'>('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [single, setSingle] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_students: 2,
    max_parents: 1,
  })

  const [bulk, setBulk] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_students: 2,
    max_parents: 1,
  })

  const resetForm = () => {
    setMode('none')
    setError(null)
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(single),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    resetForm()
    router.refresh()
    setLoading(false)
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/slots/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulk),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    resetForm()
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slot? All signups for this slot will also be deleted.')) return

    await fetch('/api/admin/slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    router.refresh()
  }

  const previewBulkSlots = () => {
    if (!bulk.start_time || !bulk.end_time) return []
    const result = []
    let current = bulk.start_time
    while (current < bulk.end_time) {
      const [h] = current.split(':').map(Number)
      const nextH = h + 2
      const next = `${String(nextH).padStart(2, '0')}:00`
      if (next > bulk.end_time) break
      result.push({ start: current, end: next })
      current = next
    }
    return result
  }

  const preview = previewBulkSlots()

  return (
    <div>
      {mode === 'none' && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('bulk')}
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition font-semibold text-sm"
          >
            + Bulk Generate Slots
          </button>
          <button
            onClick={() => setMode('single')}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-semibold text-sm"
          >
            + Add Single Slot
          </button>
        </div>
      )}

      {mode === 'bulk' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-1">Bulk Generate Slots</h2>
          <p className="text-sm text-gray-500 mb-4">
            Generate 2-hour slots automatically for a location across a time range.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={bulk.location_id}
                  onChange={e => setBulk({ ...bulk, location_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={bulk.date}
                  onChange={e => setBulk({ ...bulk, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={bulk.start_time}
                  onChange={e => setBulk({ ...bulk, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.slice(0, -1).map(t => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={bulk.end_time}
                  onChange={e => setBulk({ ...bulk, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select end time</option>
                  {TIME_OPTIONS.slice(1).map(t => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Students per Slot <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={bulk.max_students}
                  onChange={e => setBulk({ ...bulk, max_students: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parents per Slot <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={bulk.max_parents}
                  onChange={e => setBulk({ ...bulk, max_parents: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {preview.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Preview — {preview.length} slots will be created:
                </p>
                <div className="flex flex-wrap gap-2">
                  {preview.map((s, i) => (
                    <span key={i} className="bg-white border border-gray-300 text-gray-700 text-xs px-2 py-1 rounded">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || preview.length === 0}
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Generating...' : `Generate ${preview.length} Slots`}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'single' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Add Single Slot</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={single.location_id}
                  onChange={e => setSingle({ ...single, location_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={single.date}
                  onChange={e => setSingle({ ...single, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={single.start_time}
                  onChange={e => setSingle({ ...single, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.slice(0, -1).map(t => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={single.end_time}
                  onChange={e => setSingle({ ...single, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select end time</option>
                  {TIME_OPTIONS.slice(1).map(t => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Students <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={single.max_students}
                  onChange={e => setSingle({ ...single, max_students: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Parents <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={single.max_parents}
                  onChange={e => setSingle({ ...single, max_parents: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Slot'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Parents</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const active = slot.signups.filter((s: any) => !s.cancelled)
              const students = active.filter((s: any) => s.role === 'student').length
              const parents = active.filter((s: any) => s.role === 'parent').length

              return (
                <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{slot.location.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatTime(slot.start_time.slice(0, 5))} – {formatTime(slot.end_time.slice(0, 5))}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{students}/{slot.max_students}</td>
                  <td className="px-4 py-3 text-gray-700">{parents}/{slot.max_parents}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
