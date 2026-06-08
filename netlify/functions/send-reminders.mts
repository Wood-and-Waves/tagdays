import { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export default async function handler() {
  console.log('Running reminder job at', new Date().toISOString())

  // Get reminder config
  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .single()

  if (!config) {
    console.error('No admin config found')
    return
  }

  const now = new Date()

  // Get all active signups with slot and location info
  const { data: signups, error } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*))')
    .eq('cancelled', false)

  if (error) {
    console.error('Error fetching signups:', error)
    return
  }

  let reminder1Sent = 0
  let reminder2Sent = 0

  for (const signup of signups || []) {
    const slot = signup.slot
    if (!slot) continue

    // Build shift datetime
    const shiftTime = new Date(`${slot.date}T${slot.start_time}`)
    const hoursUntilShift = (shiftTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    const formattedDate = shiftTime.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })

    // Check reminder 1
    if (
      !signup.reminder_1_sent &&
      hoursUntilShift <= config.reminder_1_hours_before &&
      hoursUntilShift > config.reminder_2_hours_before
    ) {
      await sendReminder({
        signup,
        slot,
        formattedDate,
        reminderNumber: 1,
      })

      await supabase
        .from('signups')
        .update({ reminder_1_sent: true })
        .eq('id', signup.id)

      reminder1Sent++
    }

    // Check reminder 2
    if (
      !signup.reminder_2_sent &&
      hoursUntilShift <= config.reminder_2_hours_before &&
      hoursUntilShift > 0
    ) {
      await sendReminder({
        signup,
        slot,
        formattedDate,
        reminderNumber: 2,
      })

      await supabase
        .from('signups')
        .update({ reminder_2_sent: true })
        .eq('id', signup.id)

      reminder2Sent++
    }
  }

  console.log(`Reminders sent - R1: ${reminder1Sent}, R2: ${reminder2Sent}`)
}

async function sendReminder({
  signup,
  slot,
  formattedDate,
  reminderNumber,
}: {
  signup: any
  slot: any
  formattedDate: string
  reminderNumber: number
}) {
  const isToday = reminderNumber === 2
  const subject = isToday
    ? `Reminder: Your Tag Days shift is TODAY!`
    : `Reminder: Your Tag Days shift is coming up!`

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b91c1c; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0;">Tag Days 2026</h1>
        <p style="color: #fca5a5; margin: 8px 0 0;">Huntley High School Marching Band</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #111827;">Hi ${signup.first_name}, your shift is coming up!</h2>
        <p style="color: #4b5563;">
          ${isToday ? 'Your Tag Days shift is TODAY!' : 'This is a reminder about your upcoming Tag Days shift.'}
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;"><strong>Location:</strong> ${slot.location.name}</p>
          ${slot.location.address ? `<p style="margin: 0 0 8px; color: #6b7280;">${slot.location.address}</p>` : ''}
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 8px;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}</p>
          <p style="margin: 0;"><strong>Role:</strong> ${signup.role === 'student' ? 'Student' : 'Parent/Adult'}</p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #991b1b;">Remember:</p>
          <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
            <li>Arrive at the band room 20-30 minutes early</li>
            <li>Wear your spirit wear</li>
            <li>Bring your instrument or flags</li>
          </ul>
        </div>

        <p style="color: #4b5563;">Questions? Contact Amy Koegel at <a href="mailto:fundraising@huntleybands.com" style="color: #b91c1c;">fundraising@huntleybands.com</a></p>
      </div>

      <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Huntley High School Marching Band - Huntley, IL</p>
      </div>
    </div>
  `

  // Send email
  if (signup.reminder_preference === 'email' || signup.reminder_preference === 'both') {
    try {
      await resend.emails.send({
        from: 'Tag Days 2026 <noreply@hhstagdays.com>',
        to: signup.email,
        subject,
        html: emailHtml,
      })
      console.log(`Reminder ${reminderNumber} email sent to ${signup.email}`)
    } catch (err) {
      console.error(`Email failed for ${signup.email}:`, err)
    }
  }

  // Send SMS
  if ((signup.reminder_preference === 'sms' || signup.reminder_preference === 'both') && signup.phone) {
    try {
      const smsBody = isToday
        ? `Tag Days reminder: Your shift is TODAY at ${slot.start_time.slice(0, 5)} at ${slot.location.name}. Arrive at band room 20-30 min early. Go Raiders! - Huntley Band Boosters`
        : `Tag Days reminder: Your shift is coming up! ${formattedDate} at ${slot.start_time.slice(0, 5)}, ${slot.location.name}. Reply STOP to opt out. - Huntley Band Boosters`

      await twilioClient.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: signup.phone,
      })
      console.log(`Reminder ${reminderNumber} SMS sent to ${signup.phone}`)
    } catch (err) {
      console.error(`SMS failed for ${signup.phone}:`, err)
    }
  }
}

export const config: Config = {
  schedule: '0 * * * *'
}
