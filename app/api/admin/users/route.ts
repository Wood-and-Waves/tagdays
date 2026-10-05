import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminInviteEmail } from '@/lib/email/sendAdminInvite'
import { NextResponse } from 'next/server'

const SUPER_ADMIN_EMAIL = 'noreply@hhstagdays.com'

function alreadyRegistered(error: { code?: string; message: string }) {
  return error.code === 'email_exists' || /already been registered/i.test(error.message)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const adminClient = createAdminClient()

  // Create the account already confirmed, so a Google account can attach to it
  // right away. We deliberately do NOT use inviteUserByEmail: its email carries
  // a confirmation token, and confirming the address clears that same token —
  // which is why every invite link died on arrival between 2026-08-09 and now.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  // An address that already exists is not a failure — re-sending is how you
  // give someone a fresh link.
  const resent = !!createError && alreadyRegistered(createError)
  if (createError && !resent) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // A recovery token lives in its own column, so confirming the email above
  // cannot wipe it. That separation is the whole fix.
  const { data: link, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
  })

  if (linkError || !link?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Could not generate a sign-in link.' },
      { status: 500 }
    )
  }

  // Fatal on purpose: without this email they have no way into the account.
  try {
    await sendAdminInviteEmail({ to: email, actionLink: link.properties.action_link })
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : 'Could not send the email.'
    return NextResponse.json({ error: `Account ready, but the email failed: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ user: created?.user ?? link.user, resent })
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
