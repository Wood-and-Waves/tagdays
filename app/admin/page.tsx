import { createClient } from '@/lib/supabase/server'
import PageHint from '@/app/admin/PageHint'
import { getEffectiveCapacity } from '@/lib/capacity'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>
}) {
  const { event_id } = await searchParams
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  const selectedEventId = event_id || events?.[0]?.id || ''

  const { data: roles } = await supabase
    .from('event_roles')
    .select('*')
    .eq('event_id', selectedEventId)
    .order('sort_order', { ascending: true })

  const { data: slots } = await supabase
    .from('slots')
    .select('*, location:locations(*), signups(*), role_capacities:slot_role_capacities(*)')
    .eq('event_id', selectedEventId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const totalSlots = slots?.length || 0

  const getSlotData = (slot: any) => {
    const activeSignups = slot.signups.filter((s: any) => !s.cancelled)
    const roleData = (roles || []).map(role => {
      const roleSignups = activeSignups.filter((s: any) => s.role === role.name)
      const effectiveMax = getEffectiveCapacity(role, slot.role_capacities)
      return {
        role,
        signups: roleSignups,
        max: effectiveMax,
        open: Math.max(0, effectiveMax - roleSignups.length),
        full: roleSignups.length >= effectiveMax,
      }
    })
    const allFull = roleData.length > 0 && roleData.every(r => r.full)
    return { activeSignups, roleData, allFull }
  }

  let totalActiveSignups = 0
  let totalOpenSpots = 0

  slots?.forEach(slot => {
    const { activeSignups, roleData } = getSlotData(slot)
    totalActiveSignups += activeSignups.length
    roleData.forEach(r => { totalOpenSpots += r.open })
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <PageHint>Overview of shifts, signups, and open spots for the selected event.</PageHint>

      {events && events.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {events.map(event => (
            <a key={event.id} href={`/admin?event_id=${event.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedEventId === event.id ? 'bg-brand-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {event.name}
            </a>
          ))}
        </div>
      )}

      {!selectedEventId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold">No events found.</p>
          <p className="text-yellow-600 text-sm mt-1">Create an event first to see dashboard stats.</p>
          <a href="/admin/events" className="mt-4 inline-block bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Go to Events</a>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Shifts</p>
              <p className="text-3xl font-bold text-gray-900">{totalSlots}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Signups</p>
              <p className="text-3xl font-bold text-gray-900">{totalActiveSignups}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Open Spots</p>
              <p className="text-3xl font-bold text-brand-700">{totalOpenSpots}</p>
            </div>
          </div>

          {/* Slots by date */}
          <h2 className="text-lg font-bold text-gray-900 mb-4">All Shifts</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Roles</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {slots?.map(slot => {
                  const { roleData, allFull } = getSlotData(slot)

                  return (
                    <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{slot.location?.name || 'General'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {roleData.map(({ role, signups, max, full }) => (
                            <span key={role.id} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${full ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {role.name}: {signups.length}/{max}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {allFull ? (
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Full</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">Open</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
