import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'

export default async function Home() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true })

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
                <div className="mt-4 text-brand-700 text-sm font-semibold">
                  View Schedule →
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
