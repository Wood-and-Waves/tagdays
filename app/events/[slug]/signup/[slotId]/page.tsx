import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SiteHeader from '@/app/components/SiteHeader'
import { getEffectiveCapacity } from '@/lib/capacity'
import SiteFooter from '@/app/components/SiteFooter'
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

  // Signups read via service-role client (server-only), non-PII columns only —
  // anon can't read this table and email/phone must not reach the browser.
  const adminClient = createAdminClient()
  const { data: slot } = await adminClient
    .from('slots')
    .select('*, location:locations(*), signups(id, role, first_name, last_name, cancelled), role_capacities:slot_role_capacities(*)')
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
    const effectiveMax = getEffectiveCapacity(role, slot.role_capacities)
    return {
      ...role,
      filled,
      available: effectiveMax - filled,
      full: filled >= effectiveMax,
    }
  })

  const formatTime = (t: string) => {
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader
        title="Sign Up"
        subtitle={event.name}
        backHref={`/events/${slug}`}
        backLabel={event.name}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
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
                  <span className="text-brand-600">{role.available} spot{role.available !== 1 ? 's' : ''} open</span>
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

      <SiteFooter />
    </main>
  )
}
