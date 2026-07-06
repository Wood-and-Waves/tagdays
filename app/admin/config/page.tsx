import { createClient } from '@/lib/supabase/server'
import ConfigClient from './ConfigClient'
import PageHint from '@/app/admin/PageHint'

export default async function ConfigPage() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <PageHint>Configure reminder timing and other site-wide settings.</PageHint>
      <ConfigClient config={config} />
    </div>
  )
}
