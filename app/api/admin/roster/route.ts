import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { students } = await request.json()
  const adminClient = createAdminClient()

  let added = 0
  let skipped = 0

  for (const student of students) {
    const { first_name, last_name } = student
    if (!first_name || !last_name) continue

    // Check for duplicate
    const { data: existing } = await adminClient
      .from('roster')
      .select('id')
      .eq('first_name', first_name.trim())
      .eq('last_name', last_name.trim())
      .single()

    if (existing) {
      skipped++
    } else {
      const { error } = await adminClient
        .from('roster')
        .insert({ first_name: first_name.trim(), last_name: last_name.trim() })

      if (!error) added++
    }
  }

  return NextResponse.json({ added, skipped })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  await adminClient.from('roster').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  return NextResponse.json({ success: true })
}
