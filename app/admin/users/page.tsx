import { createAdminClient } from '@/lib/supabase/admin'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const adminClient = createAdminClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Users</h1>
      <UsersClient users={users || []} />
    </div>
  )
}
