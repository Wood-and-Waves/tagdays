import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await request.json()
  const adminClient = createAdminClient()

  const locationSummary: Record<string, {
    address: string
    notes: string
    isNew: boolean
    newSlots: string[]
    existingSlots: string[]
  }> = {}

  for (const row of rows) {
    const { location_name, address, notes, date, start_time, end_time } = row
    if (!location_name || !date || !start_time || !end_time) continue

    if (!locationSummary[location_name]) {
      // Check if location exists
      const { data: existingLoc } = await adminClient
        .from('locations')
        .select('id')
        .eq('name', location_name.trim())
        .single()

      locationSummary[location_name] = {
        address: address || '',
        notes: notes || '',
        isNew: !existingLoc,
        newSlots: [],
        existingSlots: [],
      }
    }

    // Get location id if exists
    const { data: loc } = await adminClient
      .from('locations')
      .select('id')
      .eq('name', location_name.trim())
      .single()

    let current = start_time.trim()
    const endTime = end_time.trim()

    while (current < endTime) {
      const [h] = current.split(':').map(Number)
      const next = `${String(h + 2).padStart(2, '0')}:00`
      if (next > endTime) break

      const slotLabel = `${date} ${current}–${next}`

      if (loc) {
        const { data: dupSlot } = await adminClient
          .from('slots')
          .select('id')
          .eq('location_id', loc.id)
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

      current = next
    }
  }

  return NextResponse.json({ locationSummary })
}
