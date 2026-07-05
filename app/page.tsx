import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
      <header className="bg-red-700 text-white py-8 px-4 shadow-md">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">HHS Band Boosters</h1>
          <p className="text-red-200 mt-1">Volunteer Signup</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {!events || events.length === 0 ? (
          <p className="text-center text-gray-500 mt-16 text-lg">
            No active events right now. Check back soon!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.slug}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-red-300 hover:shadow-md transition block">
                <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
                {(event.start_date || event.end_date) && (
                  <p className="text-red-700 font-semibold text-sm mt-1">
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>
                )}
                {event.description && (
                  <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                )}
                <div className="mt-4 text-red-700 text-sm font-semibold">
                  View Schedule →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <p className="font-semibold text-white">HHS Band Boosters</p>
            <p>Huntley High School - Huntley, IL</p>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <a href="mailto:fundraising@huntleybands.com" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}