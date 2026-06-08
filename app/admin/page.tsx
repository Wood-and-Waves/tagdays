import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: slots } = await supabase
    .from('slots')
    .select('*, signups(*), location:locations(*)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const { data: locations } = await supabase
    .from('locations')
    .select('*')

  const allSignups = slots?.flatMap(s => s.signups) || []
  const activeSignups = allSignups.filter((s: any) => !s.cancelled)
  const totalSlots = slots?.length || 0
  const totalLocations = locations?.length || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Locations</p>
          <p className="text-3xl font-bold text-gray-900">{totalLocations}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Shifts</p>
          <p className="text-3xl font-bold text-gray-900">{totalSlots}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Signups</p>
          <p className="text-3xl font-bold text-gray-900">{activeSignups.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Open Spots</p>
          <p className="text-3xl font-bold text-red-700">
            {slots?.reduce((acc, slot) => {
              const active = slot.signups.filter((s: any) => !s.cancelled)
              const students = active.filter((s: any) => s.role === 'student').length
              const parents = active.filter((s: any) => s.role === 'parent').length
              return acc + (slot.max_students - students) + (slot.max_parents - parents)
            }, 0) || 0}
          </p>
        </div>
      </div>

      {/* Slots by date */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">All Shifts</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Parents</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {slots?.map(slot => {
              const active = slot.signups.filter((s: any) => !s.cancelled)
              const students = active.filter((s: any) => s.role === 'student').length
              const parents = active.filter((s: any) => s.role === 'parent').length
              const full = students >= slot.max_students && parents >= slot.max_parents

              return (
                <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{slot.location.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={students >= slot.max_students ? 'text-green-600 font-semibold' : 'text-gray-700'}>
                      {students}/{slot.max_students}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={parents >= slot.max_parents ? 'text-green-600 font-semibold' : 'text-gray-700'}>
                      {parents}/{slot.max_parents}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {full ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Full</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">Open</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
