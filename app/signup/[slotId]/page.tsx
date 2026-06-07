import { createClient } from '@/lib/supabase/server'
import { SlotWithSignups } from '@/lib/types'
import { notFound } from 'next/navigation'
import SignupForm from './SignupForm'

export default async function SignupPage({
  params,
}: {
  params: Promise<{ slotId: string }>
}) {
  const { slotId } = await params
  const supabase = await createClient()

  const { data: slot, error } = await supabase
    .from('slots')
    .select(`
      *,
      location:locations(*),
      signups(*)
    `)
    .eq('id', slotId)
    .single()

  if (error || !slot) notFound()

  const activeSignups = slot.signups.filter((s: any) => !s.cancelled)
  const studentSignups = activeSignups.filter((s: any) => s.role === 'student')
  const parentSignups = activeSignups.filter((s: any) => s.role === 'parent')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Sign Up</h1>
          <p className="text-red-200 mt-1">Huntley High School Tag Days 2026</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Slot info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="font-bold text-lg text-gray-900">{slot.location.name}</h2>
          {slot.location.address && (
            <p className="text-sm text-gray-500">{slot.location.address}</p>
          )}
          <p className="text-gray-600 mt-1">
            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
            {' · '}
            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
          </p>

          {/* Current signups */}
          <div className="mt-4 grid grid-cols-2 gap-4">
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

        {/* Signup form */}
        <SignupForm
          slotId={slotId}
          studentsFull={studentSignups.length >= slot.max_students}
          parentsFull={parentSignups.length >= slot.max_parents}
        />
      </div>
    </main>
  )
}
