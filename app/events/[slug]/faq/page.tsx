import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'

export default async function EventFAQPage({
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader
        title="FAQ"
        subtitle={event.name}
        backHref={`/events/${slug}`}
        backLabel="Back to Schedule"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {event.faq_content ? (
            <div className="text-gray-600 whitespace-pre-wrap">{event.faq_content}</div>
          ) : (
            <p className="text-gray-400 italic">No FAQ has been added for this event yet.</p>
          )}
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
