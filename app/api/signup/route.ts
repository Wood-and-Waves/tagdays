import { createClient } from '@/lib/supabase/server'
import { sendConfirmationEmail } from '@/lib/email/sendConfirmation'
import { sendConfirmationSMS } from '@/lib/email/sendSMS'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { slot_id, first_name, last_name, email, phone, role, reminder_preference } = body

  if (!slot_id || !first_name || !last_name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('*, signups(*), location:locations(*)')
    .eq('id', slot_id)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Slot not found.' }, { status: 404 })
  }

  const activeSignups = slot.signups.filter((s: any) => !s.cancelled)
  const studentSignups = activeSignups.filter((s: any) => s.role === 'student')
  const parentSignups = activeSignups.filter((s: any) => s.role === 'parent')

  if (role === 'student' && studentSignups.length >= slot.max_students) {
    return NextResponse.json({ error: 'Student spots for this shift are full.' }, { status: 400 })
  }

  if (role === 'parent' && parentSignups.length >= slot.max_parents) {
    return NextResponse.json({ error: 'Parent spots for this shift are full.' }, { status: 400 })
  }

  const { data: signup, error: insertError } = await supabase
    .from('signups')
    .insert({
      slot_id,
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

  // Send confirmation email
  if (reminder_preference === 'email' || reminder_preference === 'both') {
    try {
      await sendConfirmationEmail({
        to: email,
        firstName: first_name,
        locationName: slot.location.name,
        address: slot.location.address,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        role,
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
        locationName: slot.location.name,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
      })
      console.log('SMS sent successfully')
    } catch (smsError) {
      console.error('SMS failed:', smsError)
    }
  }

  return NextResponse.json({ success: true, signup })
}
