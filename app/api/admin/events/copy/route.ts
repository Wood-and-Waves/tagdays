import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { copyEvent } from '@/lib/copyEvent'

/** Auth, then lib/copyEvent does the work — see that file for what a copy means. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, new_start_date, name } = await request.json()
  const result = await copyEvent(createAdminClient(), { id, newStartDate: new_start_date, name })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ event: result.event, copied: result.copied })
}
