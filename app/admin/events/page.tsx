import { createClient } from '@/lib/supabase/server'
import EventsClient from './EventsClient'
import PageHint from '@/app/admin/PageHint'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_roles(*)')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Events</h1>
      <PageHint>Create and manage events, their volunteer roles, and reminder settings.</PageHint>
      <EventsClient events={events || []} />
    </div>
  )
}