import { createClient } from '@/lib/supabase/server'
import SignupsClient from './SignupsClient'
import PageHint from '@/app/admin/PageHint'

export default async function SignupsPage({
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

  const { data: signups } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*), event:events(*))')
    .order('created_at', { ascending: false })

  const filteredSignups = (signups || []).filter(s => s.slot?.event_id === selectedEventId)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Signups</h1>
      <PageHint>View, search, and cancel volunteer signups for the selected event.</PageHint>

      {events && events.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {events.map(event => (
            <a key={event.id} href={`/admin/signups?event_id=${event.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedEventId === event.id ? 'bg-brand-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {event.name}
            </a>
          ))}
        </div>
      )}

      <SignupsClient signups={filteredSignups} eventId={selectedEventId} />
    </div>
  )
}
