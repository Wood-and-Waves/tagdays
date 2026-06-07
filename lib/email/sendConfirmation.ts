import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail({
  to,
  firstName,
  locationName,
  address,
  date,
  startTime,
  endTime,
  role,
}: {
  to: string
  firstName: string
  locationName: string
  address: string | null
  date: string
  startTime: string
  endTime: string
  role: string
}) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const formattedRole = role === 'student' ? 'Student' : 'Parent/Adult'

  await resend.emails.send({
    from: 'Tag Days 2026 <onboarding@resend.dev>',
    to,
    subject: `You're signed up for Tag Days 2026!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #b91c1c; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Tag Days 2026</h1>
          <p style="color: #fca5a5; margin: 8px 0 0;">Huntley High School Marching Band</p>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="color: #111827;">Hi ${firstName}, you're signed up!</h2>
          <p style="color: #4b5563;">Thank you for volunteering for Tag Days. Here are your shift details:</p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px;"><strong>Location:</strong> ${locationName}</p>
            ${address ? `<p style="margin: 0 0 8px; color: #6b7280;">${address}</p>` : ''}
            <p style="margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}</p>
            <p style="margin: 0;"><strong>Role:</strong> ${formattedRole}</p>
          </div>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #991b1b;">Important Reminders:</p>
            <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
              <li>Arrive at the band room 20–30 minutes before your shift</li>
              <li>Wear your spirit wear</li>
              <li>Bring your instrument or flags</li>
              <li>Students will NOT be responsible for transporting money</li>
            </ul>
          </div>

          <p style="color: #4b5563;">Questions? Contact Amy Koegel at <a href="mailto:fundraising@huntleybands.com" style="color: #b91c1c;">fundraising@huntleybands.com</a></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Huntley High School Marching Band · Huntley, IL</p>
        </div>
      </div>
    `,
  })
}
