import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendSMS({
  to,
  message,
}: {
  to: string
  message: string
}) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export async function sendConfirmationSMS({
  to,
  firstName,
  locationName,
  date,
  startTime,
  endTime,
}: {
  to: string
  firstName: string
  locationName: string
  date: string
  startTime: string
  endTime: string
}) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const message = `Hi ${firstName}! You're signed up for Tag Days 2026. Location: ${locationName}. Date: ${formattedDate}, ${startTime.slice(0, 5)}–${endTime.slice(0, 5)}. Arrive at band room 20-30 min early. Go Raiders!`

  await sendSMS({ to, message })
}
