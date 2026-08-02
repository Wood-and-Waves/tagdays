import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; r?: string }>
}) {
  const { event: eventSlug, r: reminderPreference } = await searchParams

  // Name the channel the volunteer actually chose — an SMS-only signup should
  // not be told to watch for an email. Falls back to the neutral wording.
  const confirmationChannel =
    reminderPreference === 'sms' ? 'text message'
      : reminderPreference === 'both' ? 'confirmation email and text'
        : reminderPreference === 'email' ? 'confirmation email'
          : 'confirmation'

  // Look up the event (if we know which one) so the confirmation reflects that
  // event's own reminder notes instead of hardcoded, single-event text.
  let event: { name: string; slug: string; reminder_notes: string | null } | null = null
  if (eventSlug) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('events')
      .select('name, slug, reminder_notes')
      .eq('slug', eventSlug)
      .eq('is_active', true)
      .single()
    event = data
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader
        title="You're Signed Up!"
        subtitle={event?.name || 'Huntley High School Band Boosters'}
      />

      <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you for signing up!
          </h2>
          <p className="text-gray-600 mb-6">
            You'll receive a {confirmationChannel} shortly. We'll also send you
            reminders before your shift.
          </p>

          {event?.reminder_notes && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 mb-6 text-sm text-brand-800 text-left">
              <p className="font-semibold mb-1">Remember:</p>
              <div className="whitespace-pre-wrap">{event.reminder_notes}</div>
            </div>
          )}

          <Link
            href={event ? `/events/${event.slug}` : '/'}
            className="inline-block bg-brand-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-800 transition"
          >
            Back to Schedule
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
