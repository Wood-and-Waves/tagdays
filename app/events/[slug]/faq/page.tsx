import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    .single()

  if (!event) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">FAQ</h1>
            <p className="text-red-200 mt-1">{event.name}</p>
          </div>
          <Link href={`/events/${slug}`} className="text-sm underline text-red-200 hover:text-white">
            Back to Schedule
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {event.faq_content ? (
            <div className="text-gray-600 whitespace-pre-wrap">{event.faq_content}</div>
          ) : (
            <p className="text-gray-400 italic">No FAQ has been added for this event yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}
