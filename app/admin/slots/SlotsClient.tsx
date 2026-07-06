'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Location, SlotWithSignups, EventRole } from '@/lib/types'
import { getEffectiveCapacity } from '@/lib/capacity'

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

const getCapacityPayload = (roles: EventRole[], capacities: Record<string, number>) => {
  return roles
    .filter(role => capacities[role.id] !== role.max_per_slot)
    .map(role => ({ event_role_id: role.id, max_per_slot: capacities[role.id] }))
}

const defaultCapacities = (roles: EventRole[]): Record<string, number> => {
  const result: Record<string, number> = {}
  roles.forEach(role => { result[role.id] = role.max_per_slot })
  return result
}

export default function SlotsClient({
  slots,
  locations,
  roles,
  eventId,
  eventStartDate,
  eventEndDate,
}: {
  slots: SlotWithSignups[]
  locations: Location[]
  roles: EventRole[]
  eventId: string
  eventStartDate: string | null
  eventEndDate: string | null
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
  })
  const [singleCapacities, setSingleCapacities] = useState<Record<string, number>>(() => defaultCapacities(roles))
  const [showSingleAdvanced, setShowSingleAdvanced] = useState(false)

  const [bulk, setBulk] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
  })
  const [bulkCapacities, setBulkCapacities] = useState<Record<string, number>>(() => defaultCapacities(roles))
  const [showBulkAdvanced, setShowBulkAdvanced] = useState(false)

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editCapacities, setEditCapacities] = useState<Record<string, number>>({})
  const [editLoading, setEditLoading] = useState(false)

  const resetForm = () => {
    setMode('none')
    setError(null)
    setSingleCapacities(defaultCapacities(roles))
    setBulkCapacities(defaultCapacities(roles))
    setShowSingleAdvanced(false)
    setShowBulkAdvanced(false)
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...single,
        event_id: eventId,
        role_capacities: getCapacityPayload(roles, singleCapacities),
      }),
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
      body: JSON.stringify({
        ...bulk,
        event_id: eventId,
        role_capacities: getCapacityPayload(roles, bulkCapacities),
      }),
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

  const handleEditCapacityClick = (slot: SlotWithSignups) => {
    const initial: Record<string, number> = {}
    roles.forEach(role => {
      initial[role.id] = getEffectiveCapacity(role, slot.role_capacities)
    })
    setEditCapacities(initial)
    setEditingSlotId(slot.id)
  }

  const handleCancelEditCapacity = () => {
    setEditingSlotId(null)
    setEditCapacities({})
  }

  const handleSaveCapacity = async (slotId: string) => {
    setEditLoading(true)

    const res = await fetch('/api/admin/slots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: slotId,
        role_capacities: getCapacityPayload(roles, editCapacities),
      }),
    })

    setEditLoading(false)

    if (!res.ok) {
      alert('Failed to save capacity changes.')
      return
    }

    setEditingSlotId(null)
    setEditCapacities({})
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

  const CapacityFields = ({
    capacities,
    onChange,
  }: {
    capacities: Record<string, number>
    onChange: (roleId: string, value: number) => void
  }) => (
    <div className="grid grid-cols-2 gap-3">
      {roles.map(role => (
        <div key={role.id}>
          <label className="block text-xs text-gray-500 mb-1">{role.name}</label>
          <input
            type="number"
            min={0}
            value={capacities[role.id] ?? role.max_per_slot}
            onChange={e => onChange(role.id, parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {mode === 'none' && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('bulk')}
            className="bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition font-semibold text-sm"
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
            <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-brand-600">*</span></label>
                <select required value={bulk.location_id} onChange={e => setBulk({ ...bulk, location_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-brand-600">*</span></label>
                <input type="date" required value={bulk.date} onChange={e => setBulk({ ...bulk, date: e.target.value })}
                  min={eventStartDate || undefined} max={eventEndDate || undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-brand-600">*</span></label>
                <select required value={bulk.start_time} onChange={e => setBulk({ ...bulk, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.slice(0, -1).map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-brand-600">*</span></label>
                <select required value={bulk.end_time} onChange={e => setBulk({ ...bulk, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select end time</option>
                  {TIME_OPTIONS.slice(1).map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
            </div>

            {preview.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview — {preview.length} slots will be created:</p>
                <div className="flex flex-wrap gap-2">
                  {preview.map((s, i) => (
                    <span key={i} className="bg-white border border-gray-300 text-gray-700 text-xs px-2 py-1 rounded">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowBulkAdvanced(!showBulkAdvanced)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                {showBulkAdvanced ? '▾' : '▸'} Override role capacities for these slots
              </button>
              {showBulkAdvanced && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Applies to every slot generated by this batch. Leave as default to use the event's normal capacity.</p>
                  <CapacityFields
                    capacities={bulkCapacities}
                    onChange={(roleId, value) => setBulkCapacities({ ...bulkCapacities, [roleId]: value })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading || preview.length === 0}
                className="bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition text-sm font-semibold disabled:opacity-50">
                {loading ? 'Generating...' : `Generate ${preview.length} Slots`}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
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
            <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-brand-600">*</span></label>
                <select required value={single.location_id} onChange={e => setSingle({ ...single, location_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-brand-600">*</span></label>
                <input type="date" required value={single.date} onChange={e => setSingle({ ...single, date: e.target.value })}
                  min={eventStartDate || undefined} max={eventEndDate || undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-brand-600">*</span></label>
                <select required value={single.start_time} onChange={e => setSingle({ ...single, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select start time</option>
                  {TIME_OPTIONS.slice(0, -1).map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-brand-600">*</span></label>
                <select required value={single.end_time} onChange={e => setSingle({ ...single, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select end time</option>
                  {TIME_OPTIONS.slice(1).map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowSingleAdvanced(!showSingleAdvanced)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                {showSingleAdvanced ? '▾' : '▸'} Override role capacities for this slot
              </button>
              {showSingleAdvanced && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Leave as default to use the event's normal capacity.</p>
                  <CapacityFields
                    capacities={singleCapacities}
                    onChange={(roleId, value) => setSingleCapacities({ ...singleCapacities, [roleId]: value })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Add Slot'}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Signups</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Capacity</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const active = slot.signups.filter((s: any) => !s.cancelled)
              const isEditing = editingSlotId === slot.id

              return (
                <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 align-top">
                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 align-top">{slot.location?.name || 'General'}</td>
                  <td className="px-4 py-3 text-gray-700 align-top">
                    {formatTime(slot.start_time.slice(0, 5))} – {formatTime(slot.end_time.slice(0, 5))}
                  </td>
                  <td className="px-4 py-3 text-gray-700 align-top">{active.length} signed up</td>
                  <td className="px-4 py-3 align-top">
                    {isEditing ? (
                      <div className="w-56">
                        <CapacityFields
                          capacities={editCapacities}
                          onChange={(roleId, value) => setEditCapacities({ ...editCapacities, [roleId]: value })}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveCapacity(slot.id)}
                            disabled={editLoading}
                            className="text-xs bg-brand-700 text-white px-3 py-1 rounded font-semibold hover:bg-brand-800 disabled:opacity-50"
                          >
                            {editLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEditCapacity}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded font-semibold hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {roles.map(role => {
                          const effective = getEffectiveCapacity(role, slot.role_capacities)
                          const isOverridden = effective !== role.max_per_slot
                          return (
                            <span
                              key={role.id}
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isOverridden ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}
                              title={isOverridden ? 'Custom capacity for this slot' : 'Default event capacity'}
                            >
                              {role.name}: {effective}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {!isEditing && (
                      <div className="flex flex-col gap-1 items-start">
                        <button onClick={() => handleEditCapacityClick(slot)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                          Edit Capacity
                        </button>
                        <button onClick={() => handleDelete(slot.id)}
                          className="text-brand-600 hover:text-brand-800 font-medium text-sm">
                          Delete
                        </button>
                      </div>
                    )}
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
