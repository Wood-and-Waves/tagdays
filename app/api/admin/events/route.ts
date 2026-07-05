import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, slug, description, start_date, end_date, is_active, reminder_notes, faq_content, roles } = await request.json()

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 })

  const adminClient = createAdminClient()

  const { data: event, error } = await adminClient
    .from('events')
    .insert({ name, slug, description: description || null, start_date: start_date || null, end_date: end_date || null, is_active, reminder_notes: reminder_notes || null, faq_content: faq_content || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (roles && roles.length > 0) {
    const roleRows = roles.map((r: any, i: number) => ({
      event_id: event.id,
      name: r.name,
      max_per_slot: r.max_per_slot,
      sort_order: i,
    }))
    await adminClient.from('event_roles').insert(roleRows)
  }

  return NextResponse.json({ event })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, slug, description, start_date, end_date, is_active, is_archived, reminder_notes, faq_content, roles } = await request.json()

  if (!id || !name || !slug) return NextResponse.json({ error: 'ID, name and slug are required.' }, { status: 400 })

  const adminClient = createAdminClient()

  const { data: event, error } = await adminClient
    .from('events')
    .update({ name, slug, description: description || null, start_date: start_date || null, end_date: end_date || null, is_active, is_archived: is_archived ?? false, reminder_notes: reminder_notes || null, faq_content: faq_content || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (roles) {
    await adminClient.from('event_roles').delete().eq('event_id', id)
    if (roles.length > 0) {
      const roleRows = roles.map((r: any, i: number) => ({
        event_id: id,
        name: r.name,
        max_per_slot: r.max_per_slot,
        sort_order: i,
      }))
      await adminClient.from('event_roles').insert(roleRows)
    }
  }

  return NextResponse.json({ event })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('events').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}