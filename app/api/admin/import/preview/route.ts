import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { generateSlotTimes, DEFAULT_SHIFT_MINUTES } from '@/lib/slotTimes'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows, event_id } = await request.json()
  const adminClient = createAdminClient()

  const locationSummary: Record<string, {
    address: string
    notes: string
    isNew: boolean
    newSlots: string[]
    existingSlots: string[]
  }> = {}

  // Cache existing-location lookups by name so each unique location is only
  // queried once, instead of twice per row.
  const locByName: Record<string, { id: string } | null> = {}
  const lookupLocation = async (name: string) => {
    if (!(name in locByName)) {
      const { data } = await adminClient
        .from('locations')
        .select('id')
        .eq('name', name)
        .single()
      locByName[name] = data ?? null
    }
    return locByName[name]
  }

  for (const row of rows) {
    const { location_name, address, notes, date, start_time, end_time } = row
    if (!location_name || !date || !start_time || !end_time) continue

    const loc = await lookupLocation(location_name.trim())

    if (!locationSummary[location_name]) {
      locationSummary[location_name] = {
        address: address || '',
        notes: notes || '',
        isNew: !loc,
        newSlots: [],
        existingSlots: [],
      }
    }

    const shiftMinutes = Number(row.shift_minutes) || DEFAULT_SHIFT_MINUTES

    for (const { start: current, end: next } of generateSlotTimes(start_time, end_time, shiftMinutes)) {
      const slotLabel = `${date} ${current}–${next}`

      if (loc) {
        const { data: dupSlot } = await adminClient
          .from('slots')
          .select('id')
          .eq('location_id', loc.id)
          .eq('event_id', event_id)
          .eq('date', date.trim())
          .eq('start_time', current)
          .single()

        if (dupSlot) {
          locationSummary[location_name].existingSlots.push(slotLabel)
        } else {
          locationSummary[location_name].newSlots.push(slotLabel)
        }
      } else {
        locationSummary[location_name].newSlots.push(slotLabel)
      }
    }
  }

  return NextResponse.json({ locationSummary })
}