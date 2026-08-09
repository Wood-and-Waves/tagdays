import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Keeps the signed-in session alive.
 *
 * Without this, token refresh only happens inside Server Components, where
 * cookie writes are discarded (see the catch in lib/supabase/server.ts). The
 * rotated tokens never reach the browser while the old refresh token has
 * already been spent, so people get logged out at unpredictable moments.
 *
 * This deliberately performs NO redirects. Access to /admin stays the
 * responsibility of app/admin/layout.tsx, so nothing here can accidentally
 * lock the public volunteer pages.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Reading the user is what triggers a refresh when the token is close to
  // expiring; the refreshed cookies then ride out on `response`.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need a
     * session and running on them would just add latency.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
