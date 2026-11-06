import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'
import { summarizeOpenings, EventOpenings } from '@/lib/openSpots'

export default async function Home() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true })

  // How many spots each event still has open.
  //
  // Read with the service-role client because `signups` is not anon-readable,
  // and selecting only `role` and `cancelled` — no name, no email, no phone.
  // Nothing but the COUNT reaches the browser; the rows are reduced here.
  //
  // Two queries for the whole page rather than two per event, so adding a
  // seventh concession night costs nothing.
  const openings = new Map<string, EventOpenings>()
  if (events && events.length > 0) {
    const ids = events.map(e => e.id)
    const adminClient = createAdminClient()
    const [{ data: slots }, { data: roles }] = await Promise.all([
      adminClient
        .from('slots')
        .select('id, event_id, signups(role, cancelled), role_capacities:slot_role_capacities(*)')
        .in('event_id', ids),
      adminClient.from('event_roles').select('*').in('event_id', ids),
    ])

    for (const id of ids) {
      openings.set(id, summarizeOpenings(
        (slots || []).filter(s => s.event_id === id),
        (roles || []).filter(r => r.event_id === id),
      ))
    }
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return ''
    const startDate = new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!end || start === end) return startDate
    const endDate = new Date(end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startDate} - ${endDate}`
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader title="HHS Band Boosters" subtitle="Volunteer Signup" />

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {!events || events.length === 0 ? (
          <p className="text-center text-gray-500 mt-16 text-lg">
            No active events right now. Check back soon!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.slug}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-brand-300 hover:shadow-md transition block">
                <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
                {(event.start_date || event.end_date) && (
                  <p className="text-brand-700 font-semibold text-sm mt-1">
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>
                )}
                {event.description && (
                  <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-brand-700 text-sm font-semibold">View Schedule →</span>
                  <SpotsBadge openings={openings.get(event.id)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}

function SpotsBadge({ openings }: { openings?: EventOpenings }) {
  if (!openings) return null

  // Nothing built yet is worth saying: it tells somebody not to open the page
  // to find an empty schedule.
  if (openings.shifts === 0) {
    return <span className="text-gray-400 text-xs font-semibold">Schedule coming soon</span>
  }
  if (openings.open === 0) {
    return <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded">Full</span>
  }
  return (
    <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
      {openings.open} {openings.open === 1 ? 'spot' : 'spots'} open
    </span>
  )
}
