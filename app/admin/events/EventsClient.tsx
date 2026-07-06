'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = {
  id: string
  name: string
  max_per_slot: number
  sort_order: number
}

type Event = {
  id: string
  name: string
  slug: string
  description: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  is_archived: boolean
  reminder_notes: string | null
  faq_content: string | null
  event_roles: Role[]
}

export default function EventsClient({ events }: { events: Event[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    reminder_notes: '',
    faq_content: '',
  })

  const [roles, setRoles] = useState<{ name: string; max_per_slot: number }[]>([
    { name: '', max_per_slot: 1 }
  ])

  const activeEvents = events.filter(e => !e.is_archived)
  const archivedEvents = events.filter(e => e.is_archived)

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', start_date: '', end_date: '', is_active: true, reminder_notes: '', faq_content: '' })
    setRoles([{ name: '', max_per_slot: 1 }])
    setEditing(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (event: Event) => {
    setEditing(event)
    setForm({
      name: event.name,
      slug: event.slug,
      description: event.description || '',
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      is_active: event.is_active,
      reminder_notes: event.reminder_notes || '',
      faq_content: event.faq_content || '',
    })
    setRoles(event.event_roles.length > 0
      ? event.event_roles.map(r => ({ name: r.name, max_per_slot: r.max_per_slot }))
      : [{ name: '', max_per_slot: 1 }]
    )
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm({ ...form, name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const validRoles = roles.filter(r => r.name.trim())
    if (validRoles.length === 0) {
      setError('Please add at least one role.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/admin/events', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, roles: validRoles, id: editing?.id }),
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
    if (!confirm('Permanently delete this event? All slots and signups will also be deleted. This cannot be undone.')) return
    await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  const handleToggleActive = async (event: Event) => {
    await fetch('/api/admin/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, is_active: !event.is_active, roles: event.event_roles }),
    })
    router.refresh()
  }

  const handleArchive = async (event: Event) => {
    if (!confirm(`Archive "${event.name}"? It will be hidden from the dashboard, slots, and signups tabs, but its data will be kept and you can restore it later.`)) return
    await fetch('/api/admin/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, is_active: false, is_archived: true, roles: event.event_roles }),
    })
    router.refresh()
  }

  const handleRestore = async (event: Event) => {
    await fetch('/api/admin/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, is_archived: false, roles: event.event_roles }),
    })
    router.refresh()
  }

  const addRole = () => setRoles([...roles, { name: '', max_per_slot: 1 }])
  const removeRole = (i: number) => setRoles(roles.filter((_, idx) => idx !== i))
  const updateRole = (i: number, field: string, value: string | number) => {
    setRoles(roles.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  return (
    <div>
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="mb-6 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition font-semibold text-sm">
          + Create Event
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">
            {editing ? 'Edit Event' : 'Create New Event'}
          </h2>

          {error && (
            <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name <span className="text-brand-600">*</span>
                </label>
                <input type="text" required value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Tag Days 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug <span className="text-brand-600">*</span>
                </label>
                <input type="text" required value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="tag-days-2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-xs text-gray-400 mt-1">hhstagdays.com/events/{form.slug || 'slug'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description shown on event card"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Instructions</label>
              <textarea value={form.reminder_notes}
                onChange={e => setForm({ ...form, reminder_notes: e.target.value })}
                placeholder="e.g. Wear your spirit wear and bring your instrument. Leave blank to use the default reminder text."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <p className="text-xs text-gray-400 mt-1">Shown in the reminder box of confirmation and reminder emails/texts for this event. Leave blank for a generic reminder.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">FAQ Content</label>
              <textarea value={form.faq_content}
                onChange={e => setForm({ ...form, faq_content: e.target.value })}
                placeholder="Write the FAQ content for this event's public FAQ page. Leave blank to hide the FAQ link for this event."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <p className="text-xs text-gray-400 mt-1">Shown on this event's public FAQ page. Leave blank and no FAQ link will appear for this event.</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 text-brand-700 border-gray-300 rounded" />
                <span className="text-sm font-medium text-gray-700">Active (visible to public)</span>
              </label>
            </div>

            {/* Roles */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Volunteer Roles <span className="text-brand-600">*</span>
                </label>
                <button type="button" onClick={addRole}
                  className="text-sm text-brand-700 font-semibold hover:text-brand-800">
                  + Add Role
                </button>
              </div>
              <div className="space-y-2">
                {roles.map((role, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="text" value={role.name}
                      onChange={e => updateRole(i, 'name', e.target.value)}
                      placeholder="e.g. Student, Parent, Chaperone"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-gray-500">Max per slot:</label>
                      <input type="number" min={1} value={role.max_per_slot}
                        onChange={e => updateRole(i, 'max_per_slot', parseInt(e.target.value))}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    {roles.length > 1 && (
                      <button type="button" onClick={() => removeRole(i)}
                        className="text-brand-600 hover:text-brand-800 text-sm font-semibold shrink-0">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">These roles apply to all slots in this event.</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Event'}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active events list */}
      <div className="space-y-4">
        {activeEvents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No events yet. Create your first event to get started.</p>
          </div>
        )}
        {activeEvents.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-900">{event.name}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {event.description && <p className="text-sm text-gray-500 mb-1">{event.description}</p>}
                {event.start_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {event.end_date && event.end_date !== event.start_date && (
                      <> – {new Date(event.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                    )}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.event_roles.map(role => (
                    <span key={role.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {role.name}: max {role.max_per_slot}/slot
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">hhstagdays.com/events/{event.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleToggleActive(event)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  {event.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleEdit(event)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                  Edit
                </button>
                <button onClick={() => handleArchive(event)}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                  Archive
                </button>
                <button onClick={() => handleDelete(event.id)}
                  className="text-sm text-brand-600 hover:text-brand-800 font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Archived events */}
      {archivedEvents.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium mb-3"
          >
            {showArchived ? '▾' : '▸'} Show Archived Events ({archivedEvents.length})
          </button>

          {showArchived && (
            <div className="space-y-3">
              {archivedEvents.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-gray-600">{event.name}</h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                          Archived
                        </span>
                      </div>
                      {event.start_date && (
                        <p className="text-sm text-gray-400">
                          {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRestore(event)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Restore
                      </button>
                      <button onClick={() => handleDelete(event.id)}
                        className="text-sm text-brand-600 hover:text-brand-800 font-medium">
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
