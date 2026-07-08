import { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import twilio from 'twilio'
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz'

const EVENT_TIMEZONE = 'America/Chicago'

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

  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .single()

  if (!config) {
    console.error('No admin config found')
    return
  }

  const now = new Date()
  const todayDate = format(toZonedTime(now, EVENT_TIMEZONE), 'yyyy-MM-dd')

  const { data: signups, error } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*), event:events(*))')
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

    const event = slot.event
    if (!event || !event.is_active) continue

    const shiftTime = fromZonedTime(`${slot.date}T${slot.start_time}`, EVENT_TIMEZONE)
    const hoursUntilShift = (shiftTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const isToday = slot.date === todayDate

    const formattedDate = shiftTime.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', timeZone: EVENT_TIMEZONE
    })

    if (
      !signup.reminder_1_sent &&
      hoursUntilShift <= config.reminder_1_hours_before &&
      hoursUntilShift > config.reminder_2_hours_before
    ) {
      await sendReminder({ signup, slot, event, formattedDate, isToday: false })
      await supabase.from('signups').update({ reminder_1_sent: true }).eq('id', signup.id)
      reminder1Sent++
    }

    if (
      !signup.reminder_2_sent &&
      hoursUntilShift <= config.reminder_2_hours_before &&
      hoursUntilShift > 0
    ) {
      await sendReminder({ signup, slot, event, formattedDate, isToday })
      await supabase.from('signups').update({ reminder_2_sent: true }).eq('id', signup.id)
      reminder2Sent++
    }
  }

  console.log(`Reminders sent - R1: ${reminder1Sent}, R2: ${reminder2Sent}`)
}

async function sendReminder({
  signup,
  slot,
  event,
  formattedDate,
  isToday,
}: {
  signup: any
  slot: any
  event: any
  formattedDate: string
  isToday: boolean
}) {
  const eventName = event.name || 'HHS Band Boosters Event'
  const locationName = slot.location?.name || 'TBD'
  const locationAddress = slot.location?.address || null

  const subject = isToday
    ? `Reminder: Your ${eventName} shift is TODAY!`
    : `Reminder: Your ${eventName} shift is coming up!`

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b91c1c; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0;">${eventName}</h1>
        <p style="color: #fca5a5; margin: 8px 0 0;">Huntley High School Band Boosters</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #111827;">Hi ${signup.first_name}, your shift is coming up!</h2>
        <p style="color: #4b5563;">
          ${isToday ? 'Your shift is TODAY!' : 'This is a reminder about your upcoming volunteer shift.'}
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;"><strong>Location:</strong> ${locationName}</p>
          ${locationAddress ? `<p style="margin: 0 0 8px; color: #6b7280;">${locationAddress}</p>` : ''}
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 8px;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}</p>
          <p style="margin: 0;"><strong>Role:</strong> ${signup.role}</p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #7f1d1d;">${event.reminder_notes || 'Please arrive 10-15 minutes early. If your plans change, contact Amy Koegel as soon as possible so we can find a replacement.'}</p>
        </div>

        <p style="color: #4b5563;">Questions? Contact Amy Koegel at <a href="mailto:fundraising@huntleybands.com" style="color: #b91c1c;">fundraising@huntleybands.com</a></p>
      </div>

      <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Huntley High School Band Boosters - Huntley, IL</p>
      </div>
    </div>
  `

  if (signup.reminder_preference === 'email' || signup.reminder_preference === 'both') {
    try {
      await resend.emails.send({
        from: `${eventName} <noreply@hhstagdays.com>`,
        to: signup.email,
        subject,
        html: emailHtml,
      })
      console.log(`Reminder email sent to ${signup.email}`)
    } catch (err) {
      console.error(`Email failed for ${signup.email}:`, err)
    }
  }

  if ((signup.reminder_preference === 'sms' || signup.reminder_preference === 'both') && signup.phone) {
    try {
      const smsBody = isToday
        ? `${eventName} reminder: Your shift is TODAY at ${slot.start_time.slice(0, 5)} at ${locationName}. Go Raiders! - Huntley Band Boosters`
        : `${eventName} reminder: Your shift is coming up! ${formattedDate} at ${slot.start_time.slice(0, 5)}, ${locationName}. Reply STOP to opt out. - Huntley Band Boosters`

      await twilioClient.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: signup.phone,
      })
      console.log(`Reminder SMS sent to ${signup.phone}`)
    } catch (err) {
      console.error(`SMS failed for ${signup.phone}:`, err)
    }
  }
}

export const config: Config = {
  schedule: '0 * * * *'
}
