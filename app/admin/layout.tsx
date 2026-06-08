import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <span className="font-bold text-red-400">Tag Days Admin</span>
          <a href="/admin" className="text-sm hover:text-red-400 transition">Dashboard</a>
          <a href="/admin/locations" className="text-sm hover:text-red-400 transition">Locations</a>
          <a href="/admin/slots" className="text-sm hover:text-red-400 transition">Slots</a>
          <a href="/admin/signups" className="text-sm hover:text-red-400 transition">Signups</a>
          <a href="/admin/users" className="text-sm hover:text-red-400 transition">Users</a>
        </div>
        <a href="/admin/logout" className="text-sm text-gray-400 hover:text-white transition">
          Sign Out
        </a>
      </nav>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
