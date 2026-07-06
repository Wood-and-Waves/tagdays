import { createClient } from '@/lib/supabase/server'
import LocationsClient from './LocationsClient'
import PageHint from '@/app/admin/PageHint'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Locations</h1>
      <PageHint>Manage the list of locations available when creating slots.</PageHint>
      <LocationsClient locations={locations || []} />
    </div>
  )
}

