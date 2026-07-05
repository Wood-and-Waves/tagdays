import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventClient from './EventClient'

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!event) notFound()

  const { data: roles } = await supabase
    .from('event_roles')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  const { data: slots } = await supabase
    .from('slots')
    .select('*, location:locations(*), signups(*)')
    .eq('event_id', event.id)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return ''
    const startDate = new Date(start + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })
    if (!end || start === end) return startDate
    const endDate = new Date(end + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })
    return `${startDate} – ${endDate}`
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-red-200 text-sm hover:text-white transition mb-2 block">
            ← All Events
          </Link>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          {(event.start_date || event.end_date) && (
            <p className="text-red-200 mt-1">
              {formatDateRange(event.start_date, event.end_date)}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {event.description && (
          <p className="text-gray-600 mb-6">{event.description}</p>
        )}
        <EventClient
          slots={slots || []}
          roles={roles || []}
          eventSlug={slug}
        />
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <p className="font-semibold text-white">HHS Band Boosters</p>
            <p>Huntley High School · Huntley, IL</p>
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
