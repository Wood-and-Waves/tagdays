'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupForm({
  slotId,
  studentsFull,
  parentsFull,
}: {
  slotId: string
  studentsFull: boolean
  parentsFull: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    reminder_preference: 'email',
    sms_consent: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    if (target.type === 'checkbox') {
      setForm({ ...form, [target.name]: target.checked })
    } else {
      setForm({ ...form, [target.name]: target.value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.role) {
      setError('Please select whether you are a student or parent.')
      setLoading(false)
      return
    }

    if (form.role === 'student' && studentsFull) {
      setError('Sorry, student spots for this shift are full.')
      setLoading(false)
      return
    }

    if (form.role === 'parent' && parentsFull) {
      setError('Sorry, parent spots for this shift are full.')
      setLoading(false)
      return
    }

    if ((form.reminder_preference === 'sms' || form.reminder_preference === 'both') && !form.sms_consent) {
      setError('Please check the SMS consent box to receive text reminders.')
      setLoading(false)
      return
    }

    if ((form.reminder_preference === 'sms' || form.reminder_preference === 'both') && !form.phone) {
      setError('Please enter a phone number to receive SMS reminders.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slot_id: slotId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/confirm')
  }

  const allFull = studentsFull && parentsFull
  const wantsSMS = form.reminder_preference === 'sms' || form.reminder_preference === 'both'

  if (allFull) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-semibold">This shift is full.</p>
        <p className="text-yellow-600 text-sm mt-1">Please choose a different time slot.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold"
        >
          Back to Schedule
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-4">Your Information</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am a... <span className="text-red-600">*</span>
          </label>
          <select
            name="role"
            required
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select your role</option>
            {!studentsFull && <option value="student">Student</option>}
            {!parentsFull && <option value="parent">Parent / Adult</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reminder Preference <span className="text-red-600">*</span>
          </label>
          <select
            name="reminder_preference"
            value={form.reminder_preference}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="email">Email only</option>
            <option value="sms">SMS only</option>
            <option value="both">Both email and SMS</option>
          </select>
        </div>

        {wantsSMS && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="sms_consent"
                  checked={form.sms_consent}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-red-700 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">
                  I agree to receive SMS reminders from Huntley Band Boosters about
                  my volunteer shift. Up to 3 messages per signup. Message and data
                  rates may apply. Reply STOP to opt out. Reply HELP for help.
                  View our{' '}
                  <Link href="/privacy" className="text-red-700 underline" target="_blank">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="text-red-700 underline" target="_blank">
                    Terms of Service
                  </Link>.
                </span>
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 text-white font-semibold py-3 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing up...' : 'Sign Me Up!'}
        </button>
      </form>
    </div>
  )
}
