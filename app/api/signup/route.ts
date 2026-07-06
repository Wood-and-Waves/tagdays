import { createClient } from '@/lib/supabase/server'
import { sendConfirmationEmail } from '@/lib/email/sendConfirmation'
import { sendConfirmationSMS } from '@/lib/email/sendSMS'
import { getEffectiveCapacity } from '@/lib/capacity'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { slot_id, first_name, last_name, email, phone, role, reminder_preference } = body

  if (!slot_id || !first_name || !last_name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // Get slot with event and location
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('*, location:locations(*), event:events(*)')
    .eq('id', slot_id)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Slot not found.' }, { status: 404 })
  }

  // Get event roles
  const { data: roles } = await supabase
    .from('event_roles')
    .select('*')
    .eq('event_id', slot.event_id)

  // Get any slot-specific capacity overrides
  const { data: roleCapacities } = await supabase
    .from('slot_role_capacities')
    .select('*')
    .eq('slot_id', slot_id)

  // Get current signups for capacity check
  const { data: existingSignups } = await supabase
    .from('signups')
    .select('*')
    .eq('slot_id', slot_id)
    .eq('cancelled', false)

  const roleConfig = roles?.find(r => r.name === role)
  if (!roleConfig) {
    return NextResponse.json({ error: 'Invalid role for this event.' }, { status: 400 })
  }

  const effectiveMax = getEffectiveCapacity(roleConfig, roleCapacities)

  const roleSignups = (existingSignups || []).filter(s => s.role === role)
  if (roleSignups.length >= effectiveMax) {
    return NextResponse.json({ error: `${role} spots for this shift are full.` }, { status: 400 })
  }

  // Insert signup
  const { data: signup, error: insertError } = await supabase
    .from('signups')
    .insert({
      slot_id,
      event_role_id: roleConfig.id,
      first_name,
      last_name,
      email,
      phone: phone || null,
      role,
      reminder_preference: reminder_preference || 'email',
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save signup. Please try again.' }, { status: 500 })
  }

  console.log('Signup saved, attempting notifications to:', email)

  const eventName = slot.event?.name || 'HHS Band Boosters Event'
  const locationName = slot.location?.name || 'TBD'
  const locationAddress = slot.location?.address || null

  // Send confirmation email
  if (reminder_preference === 'email' || reminder_preference === 'both') {
    try {
      await sendConfirmationEmail({
        to: email,
        firstName: first_name,
        locationName,
        address: locationAddress,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        role,
        eventName,
      })
      console.log('Email sent successfully')
      await supabase.from('signups').update({ confirmation_sent: true }).eq('id', signup.id)
    } catch (emailError) {
      console.error('Email failed:', emailError)
    }
  }

  // Send confirmation SMS
  if ((reminder_preference === 'sms' || reminder_preference === 'both') && phone) {
    try {
      await sendConfirmationSMS({
        to: phone,
        firstName: first_name,
        locationName,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        eventName,
      })
      console.log('SMS sent successfully')
    } catch (smsError) {
      console.error('SMS failed:', smsError)
    }
  }

  return NextResponse.json({ success: true, signup })
}
