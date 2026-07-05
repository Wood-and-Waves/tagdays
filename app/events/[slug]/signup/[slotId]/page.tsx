import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventSignupForm from './EventSignupForm'

export default async function EventSignupPage({
  params,
}: {
  params: Promise<{ slug: string; slotId: string }>
}) {
  const { slug, slotId } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  const { data: slot } = await supabase
    .from('slots')
    .select('*, location:locations(*), signups(*)')
    .eq('id', slotId)
    .single()

  if (!slot) notFound()

  const { data: roles } = await supabase
    .from('event_roles')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  const activeSignups = slot.signups.filter((s: any) => !s.cancelled)

  const roleAvailability = (roles || []).map(role => {
    const filled = activeSignups.filter((s: any) => s.role === role.name).length
    return {
      ...role,
      filled,
      available: role.max_per_slot - filled,
      full: filled >= role.max_per_slot,
    }
  })

  const formatTime = (t: string) => {
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <Link href={`/events/${slug}`} className="text-red-200 text-sm hover:text-white transition mb-2 block">
            ← Back to {event.name}
          </Link>
          <h1 className="text-2xl font-bold">Sign Up</h1>
          <p className="text-red-200 mt-1">{event.name}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Slot info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="font-bold text-lg text-gray-900">
            {slot.location?.name || 'General'}
          </h2>
          {slot.location?.address && (
            <p className="text-sm text-gray-500">{slot.location.address}</p>
          )}
          <p className="text-gray-600 mt-1">
            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
            {' · '}
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {roleAvailability.map(role => (
              <div key={role.id} className="text-sm">
                <span className="font-semibold text-gray-700">{role.name}:</span>
                {' '}
                {role.full ? (
                  <span className="text-gray-400">Full</span>
                ) : (
                  <span className="text-red-600">{role.available} spot{role.available !== 1 ? 's' : ''} open</span>
                )}
                {activeSignups.filter((s: any) => s.role === role.name).length > 0 && (
                  <span className="text-gray-400 ml-2">
                    ({activeSignups.filter((s: any) => s.role === role.name).map((s: any) =>
                      `${s.first_name} ${s.last_name.charAt(0)}.`
                    ).join(', ')})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <EventSignupForm
          slotId={slotId}
          eventSlug={slug}
          eventName={event.name}
          roleAvailability={roleAvailability}
        />
      </div>
    </main>
  )
}