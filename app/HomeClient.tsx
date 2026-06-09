'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlotWithSignups } from '@/lib/types'

const formatTime = (t: string) => {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric'
})

const formatDateShort = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric'
})

export default function HomeClient({ slots }: { slots: SlotWithSignups[] }) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'time' | 'location'>('time')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Get unique dates
  const uniqueDates = [...new Set(slots.map(s => s.date))].sort()

  // Filter by selected date
  const filteredSlots = selectedDate
    ? slots.filter(s => s.date === selectedDate)
    : slots

  const getSlotData = (slot: SlotWithSignups) => {
    const activeSignups = slot.signups.filter((s: any) => !s.cancelled)
    const studentSignups = activeSignups.filter((s: any) => s.role === 'student')
    const parentSignups = activeSignups.filter((s: any) => s.role === 'parent')
    const studentsFull = studentSignups.length >= slot.max_students
    const parentsFull = parentSignups.length >= slot.max_parents
    const allFull = studentsFull && parentsFull
    return { studentSignups, parentSignups, studentsFull, parentsFull, allFull }
  }

  const handleSlotClick = (slot: SlotWithSignups) => {
    const { allFull } = getSlotData(slot)
    if (!allFull) router.push(`/signup/${slot.id}`)
  }

  const byTime = [...filteredSlots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.start_time.localeCompare(b.start_time)
  })

  const byTimeGrouped = byTime.reduce((acc, slot) => {
    const key = `${slot.date}-${slot.start_time}`
    const label = `${formatDate(slot.date)} · ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
    if (!acc[key]) acc[key] = { label, slots: [] }
    acc[key].slots.push(slot)
    return acc
  }, {} as Record<string, { label: string, slots: SlotWithSignups[] }>)

  const byLocation = filteredSlots.reduce((acc, slot) => {
    const name = slot.location.name
    if (!acc[name]) acc[name] = { location: slot.location, slots: [] }
    acc[name].slots.push(slot)
    return acc
  }, {} as Record<string, { location: any, slots: SlotWithSignups[] }>)

  const SlotCard = ({ slot, showLocation = false, showDateTime = false }: {
    slot: SlotWithSignups
    showLocation?: boolean
    showDateTime?: boolean
  }) => {
    const { studentSignups, parentSignups, studentsFull, parentsFull, allFull } = getSlotData(slot)
    const studentsOpen = slot.max_students - studentSignups.length
    const parentsOpen = slot.max_parents - parentSignups.length

    return (
      <div
        onClick={() => handleSlotClick(slot)}
        className={`border-b border-gray-100 last:border-0 px-4 py-3 flex items-center justify-between gap-4 ${
          allFull ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-red-50 active:bg-red-100 transition'
        }`}
      >
        <div className="min-w-0 flex-1">
          {showLocation && (
            <p className="font-semibold text-gray-900 text-sm truncate">{slot.location.name}</p>
          )}
          {showDateTime && (
            <p className="font-semibold text-gray-900 text-sm">
              {formatDate(slot.date)} · {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </p>
          )}
          <div className="mt-1 flex flex-col gap-1 text-xs">
            <div className="flex items-baseline gap-1">
              <span className="text-gray-400 shrink-0">Students:</span>
              {!studentsFull && (
                <span className="text-red-600 font-semibold">{studentsOpen} needed</span>
              )}
              {studentSignups.length > 0 && (
                <span className="text-gray-400 ml-1">
                  {studentSignups.map((s: any) => `${s.first_name} ${s.last_name.charAt(0)}.`).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-gray-400 shrink-0">Parents:</span>
              {!parentsFull && (
                <span className="text-red-600 font-semibold">{parentsOpen} needed</span>
              )}
              {parentSignups.length > 0 && (
                <span className="text-gray-400 ml-1">
                  {parentSignups.map((s: any) => `${s.first_name} ${s.last_name.charAt(0)}.`).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {allFull ? (
            <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">Full</span>
          ) : (
            <span className="text-red-700 text-lg">›</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sort and date filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Sort toggles */}
        <button
          onClick={() => setSortBy('time')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            sortBy === 'time'
              ? 'bg-red-700 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          By Time
        </button>
        <button
          onClick={() => setSortBy('location')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            sortBy === 'location'
              ? 'bg-red-700 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          By Location
        </button>

        {/* Divider */}
        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Date filters */}
        <button
          onClick={() => setSelectedDate(null)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            selectedDate === null
              ? 'bg-gray-700 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Days
        </button>
        {uniqueDates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              selectedDate === date
                ? 'bg-gray-700 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {formatDateShort(date)}
          </button>
        ))}
      </div>

      {filteredSlots.length === 0 && (
        <p className="text-center text-gray-400 py-12">No open slots for this day.</p>
      )}

      {sortBy === 'time' && filteredSlots.length > 0 && (
        <div className="space-y-4">
          {Object.entries(byTimeGrouped).map(([key, { label, slots }]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-sm">{label}</h2>
              </div>
              {slots.map(slot => (
                <SlotCard key={slot.id} slot={slot} showLocation={true} />
              ))}
            </div>
          ))}
        </div>
      )}

      {sortBy === 'location' && filteredSlots.length > 0 && (
        <div className="space-y-4">
          {Object.entries(byLocation).map(([name, { location, slots }]) => (
            <div key={name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">{name}</h2>
                {location.address && <p className="text-sm text-gray-500">{location.address}</p>}
                {location.notes && <p className="text-sm text-yellow-600 mt-1">{location.notes}</p>}
              </div>
              {slots.map(slot => (
                <SlotCard key={slot.id} slot={slot} showDateTime={true} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}