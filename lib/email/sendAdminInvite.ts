import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * The admin password-setup email.
 *
 * Sent by us through Resend rather than by Supabase, because Supabase's own
 * invite email carries a confirmation token that is destroyed the moment the
 * address is confirmed — and we confirm it on purpose, so a Google account can
 * attach to it. A recovery link keeps its token in a separate column, so the
 * two no longer collide.
 */
export async function sendAdminInviteEmail({
  to,
  actionLink,
}: {
  to: string
  actionLink: string
}) {
  const { error } = await resend.emails.send({
    from: 'HHS Band Boosters <noreply@hhstagdays.com>',
    to,
    subject: "You've been added as an admin — HHS Band Boosters",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #b91c1c; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Tag Days Admin</h1>
          <p style="color: #fca5a5; margin: 8px 0 0;">HHS Band Boosters</p>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="color: #111827;">You've been added as an admin</h2>
          <p style="color: #4b5563;">Set a password to finish setting up your account.</p>

          <p style="margin: 28px 0;">
            <a href="${actionLink}"
               style="background-color: #b91c1c; color: white; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 8px; display: inline-block;">
              Set Your Password
            </a>
          </p>

          <p style="color: #6b7280; font-size: 13px;">
            If the button doesn't work, paste this into your browser:<br />
            <a href="${actionLink}" style="color: #b91c1c; word-break: break-all;">${actionLink}</a>
          </p>

          <p style="color: #4b5563;">Questions? Contact us at <a href="mailto:fundraising@huntleybands.com" style="color: #b91c1c;">fundraising@huntleybands.com</a></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">HHS Band Boosters · Huntley, IL</p>
        </div>
      </div>
    `,
  })

  // Surface it rather than failing silently — without this email there is no
  // way into the account.
  if (error) throw new Error(error.message)
}
