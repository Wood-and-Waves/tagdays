import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: signups, error } = await supabase
    .from('signups')
    .select('*, slot:slots(*, location:locations(*))')
    .order('slot(date)', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = [
    ['First Name', 'Last Name', 'Role', 'Email', 'Phone', 'Location', 'Date', 'Start Time', 'End Time', 'Reminder', 'Status', 'Signed Up At'].join(','),
    ...(signups || []).map(s => [
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
      s.cancelled ? 'Cancelled' : 'Active',
      new Date(s.created_at).toLocaleDateString('en-US'),
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ]

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="tagdays-signups.csv"',
    },
  })
}
