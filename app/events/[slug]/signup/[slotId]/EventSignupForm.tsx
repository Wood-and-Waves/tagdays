'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EventSignupForm({
  slotId,
  eventSlug,
  eventName,
  roleAvailability,
}: {
  slotId: string
  eventSlug: string
  eventName: string
  roleAvailability: {
    id: string
    name: string
    max_per_slot: number
    filled: number
    available: number
    full: boolean
  }[]
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

  const wantsSMS = form.reminder_preference === 'sms' || form.reminder_preference === 'both'
  const availableRoles = roleAvailability.filter(r => !r.full)
  const allFull = availableRoles.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.role) {
      setError('Please select your role.')
      setLoading(false)
      return
    }

    if (wantsSMS && !form.phone) {
      setError('Please enter a phone number to receive SMS reminders.')
      setLoading(false)
      return
    }

    if (wantsSMS && !form.sms_consent) {
      setError('Please check the SMS consent box to receive text reminders.')
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

    router.push(`/confirm?event=${eventSlug}`)
  }

  if (allFull) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-semibold">This shift is full.</p>
        <p className="text-yellow-600 text-sm mt-1">Please choose a different time slot.</p>
        <button
          onClick={() => router.push(`/events/${eventSlug}`)}
          className="mt-4 bg-brand-700 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition text-sm font-semibold"
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
        <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-brand-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400 font-normal">(optional — for SMS reminders)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="(555) 555-5555"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am signing up as... <span className="text-brand-600">*</span>
          </label>
          <select
            name="role"
            required
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select your role</option>
            {availableRoles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name} ({role.available} spot{role.available !== 1 ? 's' : ''} open)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reminder Preference <span className="text-brand-600">*</span>
          </label>
          <select
            name="reminder_preference"
            value={form.reminder_preference}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="email">Email only</option>
            <option value="sms">SMS only</option>
            <option value="both">Both email and SMS</option>
          </select>
        </div>

        {wantsSMS && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="sms_consent"
                checked={form.sms_consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-brand-700 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">
                I agree to receive recurring text messages from Huntley Band Boosters
                about my volunteer shift. Message frequency: up to 3 messages per signup.
                Message and data rates may apply. Reply HELP for help, STOP to cancel.
                View our{' '}
                <Link href="/privacy" className="text-brand-700 underline" target="_blank">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" className="text-brand-700 underline" target="_blank">
                  Terms of Service
                </Link>.
              </span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 text-white font-semibold py-3 rounded-lg hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing up...' : 'Sign Me Up!'}
        </button>
      </form>
    </div>
  )
}