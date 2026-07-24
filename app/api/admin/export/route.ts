import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')

  const { data: signups, error } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*), event:events(*))')
    .order('slot(date)', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filteredSignups = eventId
    ? (signups || []).filter(s => s.slot?.event_id === eventId)
    : (signups || [])

  const eventName = filteredSignups[0]?.slot?.event?.name || 'tagdays'
  const filenameSafe = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tagdays'

  // Guard against CSV formula injection: a cell starting with = + - @ (or a
  // control char) can execute as a formula when opened in Excel/Sheets.
  const csvCell = (val: unknown) => {
    let str = String(val ?? '')
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`
    return `"${str.replace(/"/g, '""')}"`
  }

  const rows = [
    ['Event', 'First Name', 'Last Name', 'Role', 'Email', 'Phone', 'Location', 'Date', 'Start Time', 'End Time', 'Reminder', 'SMS Consent', 'Status', 'Signed Up At'].join(','),
    ...filteredSignups.map(s => [
      s.slot?.event?.name || '',
      s.first_name,
      s.last_name,
      s.role,
      s.email,
      s.phone || '',
      s.slot?.location?.name || '',
      s.slot?.date || '',
      s.slot?.start_time?.slice(0, 5) || '',
      s.slot?.end_time?.slice(0, 5) || '',
      s.reminder_preference,
      s.sms_consent ? `Yes${s.sms_consent_at ? ' (' + new Date(s.sms_consent_at).toLocaleDateString('en-US') + ')' : ''}` : 'No',
      s.cancelled ? 'Cancelled' : 'Active',
      new Date(s.created_at).toLocaleDateString('en-US'),
    ].map(csvCell).join(','))
  ]

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filenameSafe}-signups.csv"`,
    },
  })
}
