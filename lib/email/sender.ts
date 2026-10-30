/**
 * Who our email comes FROM, in one place.
 *
 * Resend will only send from a domain that has proved it owns itself, through
 * DKIM records in that domain's DNS. hhstagdays.com has them; huntleybands.com
 * does not yet, and its DNS is held by the band site's webmaster — so moving
 * the address is a DNS job first and a code job second.
 *
 * EMAIL_FROM is read at request time rather than baked into the build, so the
 * day huntleybands.com verifies, this becomes one environment variable and no
 * deploy. Until it is set, we keep sending from the address that works:
 * mail from an unverified domain is not "slightly worse", it is rejected.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'HHS Band Boosters <noreply@hhstagdays.com>'

/**
 * Where a reply goes. Deliberately NOT the sending address: a volunteer who
 * answers "I can't make my shift" should reach a mailbox somebody reads, and
 * this one needs no DNS to work — Reply-To is just a header, so it can point
 * anywhere today.
 */
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'fundraising@huntleybands.com'
