import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await request.json()

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No data provided.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  let locationsAdded = 0
  let slotsCreated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const { location_name, address, notes, date, start_time, end_time, max_students, max_parents } = row

    if (!location_name || !date || !start_time || !end_time) {
      errors.push(`Skipping row with missing required fields: ${JSON.stringify(row)}`)
      continue
    }

    let locationId: string

    const { data: existing } = await adminClient
      .from('locations')
      .select('id')
      .eq('name', location_name.trim())
      .single()

    if (existing) {
      locationId = existing.id
    } else {
      const { data: newLocation, error: locationError } = await adminClient
        .from('locations')
        .insert({
          name: location_name.trim(),
          address: address?.trim() || null,
          notes: notes?.trim() || null,
        })
        .select()
        .single()

      if (locationError || !newLocation) {
        errors.push(`Failed to create location: ${location_name}`)
        continue
      }

      locationId = newLocation.id
      locationsAdded++
    }

    let current = start_time.trim()
    const endTime = end_time.trim()

    while (current < endTime) {
      const [h] = current.split(':').map(Number)
      const nextH = h + 2
      const next = `${String(nextH).padStart(2, '0')}:00`
      if (next > endTime) break

      const { data: dupSlot } = await adminClient
        .from('slots')
        .select('id')
        .eq('location_id', locationId)
        .eq('date', date.trim())
        .eq('start_time', current)
        .single()

      if (dupSlot) {
        skipped++
      } else {
        const { error: slotError } = await adminClient
          .from('slots')
          .insert({
            location_id: locationId,
            date: date.trim(),
            start_time: current,
            end_time: next,
            max_students: parseInt(max_students) || 2,
            max_parents: parseInt(max_parents) || 1,
          })

        if (slotError) {
          errors.push(`Failed to create slot: ${location_name} ${date} ${current}`)
        } else {
          slotsCreated++
        }
      }

      current = next
    }
  }

  return NextResponse.json({
    success: true,
    locationsAdded,
    slotsCreated,
    skipped,
    errors,
  })
}
