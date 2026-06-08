import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SUPER_ADMIN_EMAIL = 'noreply@hhstagdays.com'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data.user })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

  // Prevent deleting yourself
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Get the user being deleted
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(id)

  // Prevent deleting super admin
  if (targetUser?.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'This account cannot be deleted.' }, { status: 400 })
  }

  // Prevent deleting last admin
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const visibleUsers = users.filter(u => u.email !== SUPER_ADMIN_EMAIL)
  if (visibleUsers.length <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last admin account.' }, { status: 400 })
  }

  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: { users }, error } = await adminClient.auth.admin.listUsers()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hide super admin from the list
  const filteredUsers = users.filter(u => u.email !== SUPER_ADMIN_EMAIL)
  return NextResponse.json({ users: filteredUsers })
}
