import { createClient } from '@/lib/supabase/server'
import { SlotWithSignups } from '@/lib/types'
import Link from 'next/link'
import HomeClient from './HomeClient'

export default async function Home() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [slotsResult, configResult] = await Promise.all([
    supabase
      .from('slots')
      .select('*, location:locations(*), signups(*)')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('admin_config')
      .select('event_year')
      .single()
  ])

  const allSlots = (slotsResult.data as SlotWithSignups[] || [])
  const eventYear = configResult.data?.event_year || 2026

  const totalSlots = allSlots.length
  const totalStudentSpots = allSlots.reduce((acc, s) => acc + s.max_students, 0)
  const totalParentSpots = allSlots.reduce((acc, s) => acc + s.max_parents, 0)
  const filledStudents = allSlots.reduce((acc, s) => {
    const active = s.signups.filter((sg: any) => !sg.cancelled)
    return acc + active.filter((sg: any) => sg.role === 'student').length
  }, 0)
  const filledParents = allSlots.reduce((acc, s) => {
    const active = s.signups.filter((sg: any) => !sg.cancelled)
    return acc + active.filter((sg: any) => sg.role === 'parent').length
  }, 0)
  const openSpots = (totalStudentSpots - filledStudents) + (totalParentSpots - filledParents)
  const totalSignups = filledStudents + filledParents

  const openSlots = allSlots.filter(slot => {
    const active = slot.signups.filter((s: any) => !s.cancelled)
    const students = active.filter((s: any) => s.role === 'student').length
    const parents = active.filter((s: any) => s.role === 'parent').length
    return students < slot.max_students || parents < slot.max_parents
  })

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tag Days {eventYear}</h1>
            <p className="text-red-200 mt-1">Huntley High School Band Boosters</p>
          </div>
          <Link href="/faq" className="text-sm underline text-red-200 hover:text-white">
            What is Tag Days?
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="mb-8">
          <div className="sm:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Open Spots Remaining</p>
            <p className="text-4xl font-bold text-red-700">{openSpots}</p>
          </div>
          <div className="hidden sm:grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Shifts</p>
              <p className="text-3xl font-bold text-gray-900">{totalSlots}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Signups</p>
              <p className="text-3xl font-bold text-gray-900">{totalSignups}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Students Filled</p>
              <p className="text-3xl font-bold text-gray-900">{filledStudents}/{totalStudentSpots}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Open Spots</p>
              <p className="text-3xl font-bold text-red-700">{openSpots}</p>
            </div>
          </div>
        </div>

        {openSlots.length === 0 ? (
          <p className="text-center text-gray-500 mt-16 text-lg">
            All shifts are full! Thank you to everyone who signed up.
          </p>
        ) : (
          <HomeClient slots={openSlots} />
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <p className="font-semibold text-white">Tag Days {eventYear}</p>
            <p>Huntley High School Band Boosters · Huntley, IL</p>
          </div>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-white transition">FAQ</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <a href="mailto:fundraising@huntleybands.com" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
