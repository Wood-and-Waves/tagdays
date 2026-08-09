import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * Where Google sends people back to after they approve sign-in.
 *
 * Everyone who can sign in to this app is a full admin, so the important job
 * here is making sure Google can only be used to get INTO an account that
 * already exists — never to create one.
 *
 * Two independent things enforce that:
 *   1. "Allow new users to sign up" is off in Supabase, so Google sign-in is
 *      rejected outright for an address with no account.
 *   2. The identity check below, which holds even if that setting is changed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Google reports refusals (e.g. the user cancelled) on the query string.
  const oauthError = searchParams.get('error_description') || searchParams.get('error')
  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'sign_in_failed')}`)
  }

  // Every account created by an invite carries an `email` identity. An account
  // that Google conjured up on the spot would carry only `google`, which means
  // nobody ever invited this person — sign them straight back out.
  //
  // This keys on identity rather than account age so that somebody who was
  // genuinely invited moments ago is never turned away by mistake. The account
  // is deliberately left in place rather than deleted: refusing entry is enough,
  // and deleting on the strength of one check risks removing a real admin.
  const admin = createAdminClient()
  const { data: full } = await admin.auth.admin.getUserById(data.user.id)
  const invited = full?.user?.identities?.some(i => i.provider === 'email')

  if (!invited) {
    console.warn('Rejected Google sign-in for an uninvited account:', data.user.id)
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=not_invited`)
  }

  return NextResponse.redirect(`${origin}/admin`)
}
