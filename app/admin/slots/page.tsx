import { createClient } from '@/lib/supabase/server'
import SlotsClient from './SlotsClient'
import ImportClient from './ImportClient'

export default async function SlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>
}) {
  const { event_id } = await searchParams
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: true })

  const selectedEventId = event_id || events?.[0]?.id || ''

  const { data: slots } = await supabase
    .from('slots')
    .select('*, location:locations(*), signups(*)')
    .eq('event_id', selectedEventId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true })

  const { data: roles } = await supabase
    .from('event_roles')
    .select('*')
    .eq('event_id', selectedEventId)
    .order('sort_order', { ascending: true })

  const existingLocationNames = (locations || []).map(l => l.name)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Slots</h1>

      {events && events.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {events.map(event => (
            <a key={event.id} href={`/admin/slots?event_id=${event.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedEventId === event.id ? 'bg-red-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {event.name}
            </a>
          ))}
        </div>
      )}

      {selectedEventId ? (
        <>
          <ImportClient existingLocationNames={existingLocationNames} eventId={selectedEventId} />
          <SlotsClient slots={slots || []} locations={locations || []} roles={roles || []} eventId={selectedEventId} />
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold">No events found.</p>
          <p className="text-yellow-600 text-sm mt-1">Create an event first before adding slots.</p>
          <a href="/admin/events" className="mt-4 inline-block bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Go to Events</a>
        </div>
      )}
    </div>
  )
}