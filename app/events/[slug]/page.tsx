import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'
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

  // Signups are read with the service-role client (server-only) and limited
  // to non-PII columns — the anon role can no longer read this table, and we
  // never want email/phone reaching the browser via the page payload.
  const adminClient = createAdminClient()
  const { data: slots } = await adminClient
    .from('slots')
    .select('*, location:locations(*), signups(id, role, first_name, last_name, cancelled), role_capacities:slot_role_capacities(*)')
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
      <SiteHeader
        title={event.name}
        subtitle={formatDateRange(event.start_date, event.end_date) || undefined}
        backHref="/"
        backLabel="All Events"
        rightLinkHref={event.faq_content ? `/events/${slug}/faq` : undefined}
        rightLinkLabel={event.faq_content ? 'FAQ' : undefined}
      />

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

      <SiteFooter />
    </main>
  )
}
