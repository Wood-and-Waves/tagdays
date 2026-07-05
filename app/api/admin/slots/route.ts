import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, location_id, date, start_time, end_time } = await request.json()

  if (!event_id || !date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('slots')
    .insert({ event_id, location_id: location_id || null, date, start_time, end_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
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