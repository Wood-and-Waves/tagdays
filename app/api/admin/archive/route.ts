import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { confirmation } = await request.json()

  if (confirmation !== 'DELETE ALL DATA') {
    return NextResponse.json(
      { error: 'Invalid confirmation. Type DELETE ALL DATA to confirm.' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Delete in order: signups first, then slots, then locations
  const { error: signupsError } = await adminClient.from('signups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (signupsError) return NextResponse.json({ error: signupsError.message }, { status: 500 })

  const { error: slotsError } = await adminClient.from('slots').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (slotsError) return NextResponse.json({ error: slotsError.message }, { status: 500 })

  const { error: locationsError } = await adminClient.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (locationsError) return NextResponse.json({ error: locationsError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
