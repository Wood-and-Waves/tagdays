import { createClient } from '@/lib/supabase/server'
import { SlotWithSignups } from '@/lib/types'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const { data: slots, error } = await supabase
    .from('slots')
    .select(`
      *,
      location:locations(*),
      signups(*)
    `)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error(error)
  }

  const slotsByDate = (slots as SlotWithSignups[] || []).reduce((acc, slot) => {
    const date = slot.date
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, SlotWithSignups[]>)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tag Days 2026</h1>
            <p className="text-red-200 mt-1">Huntley High School Marching Band</p>
          </div>
          <Link href="/faq" className="text-sm underline text-red-200 hover:text-white">
            What is Tag Days?
          </Link>
        </div>
      </header>

      {/* Schedule */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {Object.keys(slotsByDate).length === 0 ? (
          <p className="text-center text-gray-500 mt-16 text-lg">
            Schedule coming soon. Check back later!
          </p>
        ) : (
          Object.entries(slotsByDate).map(([date, daySlots]) => (
            <div key={date} className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-700 pb-2">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>

              <div className="grid gap-4">
                {daySlots.map(slot => {
                  const activeSignups = slot.signups.filter(s => !s.cancelled)
                  const studentSignups = activeSignups.filter(s => s.role === 'student')
                  const parentSignups = activeSignups.filter(s => s.role === 'parent')
                  const studentsFull = studentSignups.length >= slot.max_students
                  const parentsFull = parentSignups.length >= slot.max_parents
                  const allFull = studentsFull && parentsFull

                  return (
                    <div key={slot.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900">{slot.location.name}</h3>
                          {slot.location.address && (
                            <p className="text-sm text-gray-500">{slot.location.address}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-right">
                          {allFull ? (
                            <span className="inline-block bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                              Full
                            </span>
                          ) : (
                            <Link
                              href={`/signup/${slot.id}`}
                              className="inline-block bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-800 transition"
                            >
                              Sign Up
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Volunteer slots */}
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {/* Students */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Students ({studentSignups.length}/{slot.max_students})
                          </p>
                          {Array.from({ length: slot.max_students }).map((_, i) => {
                            const signup = studentSignups[i]
                            return (
                              <div key={i} className="text-sm py-1 border-b border-gray-100">
                                {signup ? (
                                  <span className="text-gray-800">
                                    {signup.first_name} {signup.last_name.charAt(0)}.
                                    <span className="text-gray-400 text-xs ml-1">(Student)</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-300 italic">Open</span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Parents */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Parents ({parentSignups.length}/{slot.max_parents})
                          </p>
                          {Array.from({ length: slot.max_parents }).map((_, i) => {
                            const signup = parentSignups[i]
                            return (
                              <div key={i} className="text-sm py-1 border-b border-gray-100">
                                {signup ? (
                                  <span className="text-gray-800">
                                    {signup.first_name} {signup.last_name.charAt(0)}.
                                    <span className="text-gray-400 text-xs ml-1">(Parent)</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-300 italic">Open</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
