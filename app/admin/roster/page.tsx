import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RosterClient from './RosterClient'
import PageHint from '@/app/admin/PageHint'

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>
}) {
  const { event_id } = await searchParams
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  const selectedEventId = event_id || events?.[0]?.id || ''

  // The roster itself is the whole band — it isn't tied to an event.
  const { data: roster } = await adminClient
    .from('roster')
    .select('*')
    .order('last_name', { ascending: true })

  const { data: signups } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*))')
    .eq('cancelled', false)
    .ilike('role', 'student')

  // Shift counts are per-event: without this, a student's total would mix
  // fundraisers together and include archived events from previous years.
  const filteredSignups = (signups || []).filter(s => s.slot?.event_id === selectedEventId)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Roster</h1>
      <PageHint>Cross-reference signups against your student roster for the selected event.</PageHint>

      {events && events.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {events.map(event => (
            <a key={event.id} href={`/admin/roster?event_id=${event.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedEventId === event.id ? 'bg-brand-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {event.name}
            </a>
          ))}
        </div>
      )}

      <RosterClient roster={roster || []} signups={filteredSignups} />
    </div>
  )
}
