import { createClient } from '@/lib/supabase/server'
import SignupsClient from './SignupsClient'

export default async function SignupsPage() {
  const supabase = await createClient()

  const { data: signups } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*))')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Signups</h1>
      <SignupsClient signups={signups || []} />
    </div>
  )
}
