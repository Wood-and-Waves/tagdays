import Link from 'next/link'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader title="You're Signed Up!" subtitle="Huntley High School Band Boosters" />

      <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you for signing up!
          </h2>
          <p className="text-gray-600 mb-6">
            You'll receive a confirmation email shortly. We'll also send you
            reminders before your shift.
          </p>
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 mb-6 text-sm text-brand-800">
            <p className="font-semibold mb-1">Remember:</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Arrive at the band room 20–30 minutes before your shift</li>
              <li>Wear your spirit wear</li>
              <li>Bring your instrument or flags</li>
              <li>Students will NOT be responsible for transporting money</li>
            </ul>
          </div>
          <Link
            href="/"
            className="inline-block bg-brand-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-800 transition"
          >
            Back to Schedule
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
