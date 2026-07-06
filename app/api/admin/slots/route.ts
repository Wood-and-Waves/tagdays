import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, location_id, date, start_time, end_time, role_capacities } = await request.json()

  if (!event_id || !date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('slots')
    .insert({ event_id, location_id: location_id || null, date, start_time, end_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (role_capacities && role_capacities.length > 0) {
    const capacityRows = role_capacities.map((rc: { event_role_id: string; max_per_slot: number }) => ({
      slot_id: data.id,
      event_role_id: rc.event_role_id,
      max_per_slot: rc.max_per_slot,
    }))
    const { error: capacityError } = await supabase.from('slot_role_capacities').insert(capacityRows)
    if (capacityError) return NextResponse.json({ error: capacityError.message }, { status: 500 })
  }

  return NextResponse.json({ slot: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, role_capacities } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

  const { error: deleteError } = await supabase.from('slot_role_capacities').delete().eq('slot_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (role_capacities && role_capacities.length > 0) {
    const capacityRows = role_capacities.map((rc: { event_role_id: string; max_per_slot: number }) => ({
      slot_id: id,
      event_role_id: rc.event_role_id,
      max_per_slot: rc.max_per_slot,
    }))
    const { error: insertError } = await supabase.from('slot_role_capacities').insert(capacityRows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

  const { error } = await supabase.from('slots').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
