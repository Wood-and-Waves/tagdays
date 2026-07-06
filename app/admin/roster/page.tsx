import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RosterClient from './RosterClient'
import PageHint from '@/app/admin/PageHint'

export default async function RosterPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: roster } = await adminClient
    .from('roster')
    .select('*')
    .order('last_name', { ascending: true })

  const { data: signups } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*))')
    .eq('cancelled', false)
    .eq('role', 'student')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Roster</h1>
      <PageHint>Cross-reference signups against your student roster.</PageHint>
      <RosterClient roster={roster || []} signups={signups || []} />
    </div>
  )
}
