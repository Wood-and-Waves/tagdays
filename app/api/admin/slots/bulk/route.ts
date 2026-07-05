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

  const slots = []
  let current = start_time

  while (current < end_time) {
    const [h, m] = current.split(':').map(Number)
    const nextH = h + 2
    const next = `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    if (next > end_time) break

    slots.push({
      event_id,
      location_id: location_id || null,
      date,
      start_time: current,
      end_time: next,
    })

    current = next
  }

  if (slots.length === 0) {
    return NextResponse.json({ error: 'No slots could be generated. Check your time range.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('slots')
    .insert(slots)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slots: data, count: data.length })
}