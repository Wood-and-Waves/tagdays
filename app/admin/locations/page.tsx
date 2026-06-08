import { createClient } from '@/lib/supabase/server'
import LocationsClient from './LocationsClient'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Locations</h1>
      <LocationsClient locations={locations || []} />
    </div>
  )
}

