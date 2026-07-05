import { createClient } from '@/lib/supabase/server'
import EventsClient from './EventsClient'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_roles(*)')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Events</h1>
      <EventsClient events={events || []} />
    </div>
  )
}