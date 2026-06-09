'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RosterStudent } from '@/lib/types'

type SignupCount = 0 | 1 | 2 | 'more'

function matchSignups(student: RosterStudent, signups: any[]) {
  const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
  return signups.filter(s => {
    const signupName = `${s.first_name} ${s.last_name}`.toLowerCase()
    return signupName === fullName
  })
}

export default function RosterClient({
  roster,
  signups,
}: {
  roster: RosterStudent[]
  signups: any[]
}) {
  const router = useRouter()
  const [rosterText, setRosterText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2+'>('all')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const lines = rosterText.trim().split('\n').filter(l => l.trim())
    const students = lines.map(line => {
      const parts = line.trim().split(/\s+/)
      const first_name = parts[0] || ''
      const last_name = parts.slice(1).join(' ') || ''
      return { first_name, last_name }
    }).filter(s => s.first_name && s.last_name)

    if (students.length === 0) {
      setError('No valid names found. Enter one name per line (First Last).')
      setLoading(false)
      return
    }

    const res = await fetch('/api/admin/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Import failed.')
      setLoading(false)
      return
    }

    setSuccess(`${data.added} students added, ${data.skipped} already existed.`)
    setRosterText('')
    setShowImport(false)
    router.refresh()
    setLoading(false)
  }

  const handleClearRoster = async () => {
    if (!confirm('Clear the entire roster? This cannot be undone.')) return

    await fetch('/api/admin/roster', { method: 'DELETE' })
    router.refresh()
  }

  // Match each student to their signups
  const studentsWithCounts = roster.map(student => {
    const matched = matchSignups(student, signups)
    return { ...student, shiftCount: matched.length, shifts: matched }
  })

  // Find unmatched signups
  const matchedSignupIds = new Set(
    studentsWithCounts.flatMap(s => s.shifts.map((sg: any) => sg.id))
  )
  const unmatchedSignups = signups.filter(s => !matchedSignupIds.has(s.id))

  // Filter and search
  const filtered = studentsWithCounts.filter(s => {
    const matchesFilter =
      filter === 'all' ||
      (filter === '0' && s.shiftCount === 0) ||
      (filter === '1' && s.shiftCount === 1) ||
      (filter === '2+' && s.shiftCount >= 2)

    const matchesSearch = search === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const count0 = studentsWithCounts.filter(s => s.shiftCount === 0).length
  const count1 = studentsWithCounts.filter(s => s.shiftCount === 1).length
  const count2 = studentsWithCounts.filter(s => s.shiftCount >= 2).length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">No Shifts</p>
          <p className="text-3xl font-bold text-red-700">{count0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">1 Shift</p>
          <p className="text-3xl font-bold text-yellow-600">{count1}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">2+ Shifts</p>
          <p className="text-3xl font-bold text-green-600">{count2}</p>
        </div>
      </div>

      {/* Import section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition"
        >
          <div>
            <p className="font-bold text-gray-900">Import Student Roster</p>
            <p className="text-sm text-gray-500">Paste a list of student names, one per line</p>
          </div>
          <span className="text-gray-400 text-xl">{showImport ? '▲' : '▼'}</span>
        </button>

        {showImport && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">
                {success}
              </div>
            )}
            <p className="text-xs text-gray-400 mb-3">
              Enter one student per line in "First Last" format. Duplicates will be skipped.
            </p>
            <textarea
              value={rosterText}
              onChange={e => setRosterText(e.target.value)}
              placeholder="Jonathan Smith&#10;Angela Johnson&#10;Mike Davis"
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={loading || !rosterText.trim()}
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import Names'}
              </button>
              <button
                onClick={handleClearRoster}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
              >
                Clear Roster
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {(['all', '0', '1', '2+'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f
                ? 'bg-red-700 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : f === '0' ? 'No shifts' : f === '1' ? '1 shift' : '2+ shifts'}
          </button>
        ))}
      </div>

      {/* Roster table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Shifts Signed Up</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(student => (
              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                    student.shiftCount === 0
                      ? 'bg-red-100 text-red-700'
                      : student.shiftCount === 1
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {student.shiftCount} shift{student.shiftCount !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {student.shifts.map((sg: any, i: number) => (
                    <span key={i} className="block">
                      {sg.slot?.location?.name} · {sg.slot?.date} {sg.slot?.start_time?.slice(0, 5)}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Unmatched signups */}
      {unmatchedSignups.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 overflow-hidden">
          <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
            <h2 className="font-bold text-yellow-800">
              Unmatched Student Signups ({unmatchedSignups.length})
            </h2>
            <p className="text-xs text-yellow-600 mt-1">
              These students signed up but are not on the roster — possible name mismatch or nickname.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name on Signup</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {unmatchedSignups.map(signup => (
                <tr key={signup.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {signup.first_name} {signup.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {signup.slot?.location?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {signup.slot?.date} {signup.slot?.start_time?.slice(0, 5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
