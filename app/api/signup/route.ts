import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail } from '@/lib/email/sendConfirmation'
import { sendConfirmationSMS } from '@/lib/email/sendSMS'
import { getEffectiveCapacity } from '@/lib/capacity'
import { evaluateSignupGuards } from '@/lib/signupGuards'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  // Anon can no longer read/update signups (PII lockdown); use the service-role
  // client for the capacity check and the confirmation_sent flag.
  const admin = createAdminClient()
  const body = await request.json()

  const { slot_id, first_name, last_name, email, phone, role, reminder_preference, sms_consent, company_website, form_token } = body

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

  // Get current signups for capacity check (service-role: anon can't read signups)
  const { data: existingSignups } = await admin
    .from('signups')
    .select('id, role, email')
    .eq('slot_id', slot_id)
    .eq('cancelled', false)

  // Invisible bot protection: honeypot, signed timing token, duplicate email.
  const verdict = evaluateSignupGuards({
    honeypot: company_website,
    formToken: form_token,
    email,
    existingEmails: (existingSignups || []).map(s => s.email).filter(Boolean) as string[],
  })

  if (verdict.action === 'bot') {
    // Fake success: bot believes it won, but we insert nothing and send nothing.
    console.warn('Signup rejected by bot guard for slot', slot_id)
    return NextResponse.json({ success: true })
  }

  if (verdict.action === 'duplicate') {
    return NextResponse.json(
      { error: "You're already signed up for this shift!" },
      { status: 400 }
    )
  }

  const roleConfig = roles?.find(r => r.name === role)
  if (!roleConfig) {
    return NextResponse.json({ error: 'Invalid role for this event.' }, { status: 400 })
  }

  const effectiveMax = getEffectiveCapacity(roleConfig, roleCapacities)

  const roleSignups = (existingSignups || []).filter(s => s.role === role)
  if (roleSignups.length >= effectiveMax) {
    return NextResponse.json({ error: `${role} spots for this shift are full.` }, { status: 400 })
  }

  // Insert signup (service-role: anon has insert but no read, so a RETURNING
  // select would come back empty and break .single())
  const { data: signup, error: insertError } = await admin
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
      sms_consent: sms_consent === true,
      sms_consent_at: sms_consent === true ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    // The DB capacity trigger rejects an overfill (e.g. two people racing for
    // the last spot past the pre-check above) with a ROLE_FULL exception.
    if (insertError.message?.includes('ROLE_FULL')) {
      return NextResponse.json({ error: `${role} spots for this shift are full.` }, { status: 400 })
    }
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
      await admin.from('signups').update({ confirmation_sent: true }).eq('id', signup.id)
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
