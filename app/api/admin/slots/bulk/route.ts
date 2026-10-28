import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateSlotTimes, formatDuration, DEFAULT_SHIFT_MINUTES } from '@/lib/slotTimes'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, location_id, date, start_time, end_time, role_capacities, shift_minutes } = await request.json()

  if (!event_id || !date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // Older callers sent no length at all and meant two hours.
  const shiftMinutes = Number(shift_minutes) || DEFAULT_SHIFT_MINUTES
  if (shiftMinutes <= 0) {
    return NextResponse.json({ error: 'Shift length must be more than zero.' }, { status: 400 })
  }

  const times = generateSlotTimes(start_time, end_time, shiftMinutes)

  if (times.length === 0) {
    return NextResponse.json(
      { error: `No shifts fit between ${start_time} and ${end_time} at ${formatDuration(shiftMinutes)} each.` },
      { status: 400 },
    )
  }

  const slots = times.map(t => ({
    event_id,
    location_id: location_id || null,
    date,
    start_time: t.start,
    end_time: t.end,
  }))

  const { data, error } = await supabase
    .from('slots')
    .insert(slots)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (role_capacities && role_capacities.length > 0 && data) {
    const capacityRows = data.flatMap(slot =>
      role_capacities.map((rc: { event_role_id: string; max_per_slot: number }) => ({
        slot_id: slot.id,
        event_role_id: rc.event_role_id,
        max_per_slot: rc.max_per_slot,
      }))
    )
    const { error: capacityError } = await supabase.from('slot_role_capacities').insert(capacityRows)
    if (capacityError) return NextResponse.json({ error: capacityError.message }, { status: 500 })
  }

  return NextResponse.json({ slots: data, count: data.length })
}
