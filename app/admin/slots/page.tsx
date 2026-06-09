import { createClient } from '@/lib/supabase/server'
import SlotsClient from './SlotsClient'
import ImportClient from './ImportClient'

export default async function SlotsPage() {
  const supabase = await createClient()

  const { data: slots } = await supabase
    .from('slots')
    .select('*, location:locations(*), signups(*)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true })

  const existingLocationNames = (locations || []).map(l => l.name)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Slots</h1>
      <ImportClient existingLocationNames={existingLocationNames} />
      <SlotsClient slots={slots || []} locations={locations || []} />
    </div>
  )
}
