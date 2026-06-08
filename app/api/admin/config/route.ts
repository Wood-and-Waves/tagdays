import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reminder_1_hours_before, reminder_2_hours_before } = await request.json()

  if (!reminder_1_hours_before || !reminder_2_hours_before) {
    return NextResponse.json({ error: 'Both reminder times are required.' }, { status: 400 })
  }

  if (reminder_2_hours_before >= reminder_1_hours_before) {
    return NextResponse.json(
      { error: 'Second reminder must be sooner than the first reminder.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('admin_config')
    .update({ reminder_1_hours_before, reminder_2_hours_before, updated_at: new Date().toISOString() })
    .eq('id', (await supabase.from('admin_config').select('id').single()).data?.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
