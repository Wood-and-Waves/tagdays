import Link from 'next/link'

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">You're Signed Up!</h1>
          <p className="text-red-200 mt-1">Huntley High School Tag Days 2026</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you for signing up!
          </h2>
          <p className="text-gray-600 mb-6">
            You'll receive a confirmation email shortly. We'll also send you
            reminders before your shift.
          </p>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-sm text-red-800">
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
            className="inline-block bg-red-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-800 transition"
          >
            Back to Schedule
          </Link>
        </div>
      </div>
    </main>
  )
}
