import { createClient } from '@/lib/supabase/server'
import ConfigClient from './ConfigClient'

export default async function ConfigPage() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <ConfigClient config={config} />
    </div>
  )
}
