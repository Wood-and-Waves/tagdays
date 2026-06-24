import Link from 'next/link'

export default function SMSOptInPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">SMS Opt-In Process</h1>
          <p className="text-red-200 mt-1">Huntley High School Band Boosters — Tag Days</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Overview</h2>
          <p className="text-gray-600">
            Huntley High School Band Boosters uses SMS messaging to send volunteer shift
            confirmations and reminders for the annual Tag Days fundraiser. This page
            documents how volunteers opt in to receive SMS messages from us.
          </p>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <p><strong>Organization:</strong> Huntley High School Band Boosters</p>
            <p><strong>Website:</strong> https://hhstagdays.com</p>
            <p><strong>Contact:</strong> fundraising@huntleybands.com</p>
            <p><strong>Message types:</strong> Confirmation (1 message) + Reminders (up to 2 messages per signup)</p>
            <p><strong>Message frequency:</strong> Up to 3 messages per volunteer signup</p>
          </div>
        </div>

        {/* Step by step */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Step-by-Step Opt-In Flow</h2>
          <div className="space-y-6">

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer visits hhstagdays.com</p>
                <p className="text-gray-600 text-sm mt-1">The public schedule page shows all available volunteer shifts organized by time or location.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer selects a shift</p>
                <p className="text-gray-600 text-sm mt-1">Tapping an available shift opens the signup form for that specific time and location.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer completes the signup form</p>
                <p className="text-gray-600 text-sm mt-1">The form collects: First name, Last name, Email address, Phone number (optional), Role (Student or Parent), and Reminder preference.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer selects SMS reminder preference</p>
                <p className="text-gray-600 text-sm mt-1">
                  The reminder preference dropdown has three options: <strong>Email only</strong>, <strong>SMS only</strong>, or <strong>Both email and SMS</strong>.
                  The SMS consent checkbox is <strong>always visible on the form</strong> regardless of which option is selected.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer actively checks the SMS consent checkbox</p>
                <p className="text-gray-600 text-sm mt-1">
                  The SMS consent checkbox is <strong>always displayed on the form and is unchecked by default</strong>. If the volunteer selects SMS or Both as their reminder preference, they must actively check this box before the form will submit. The form will not submit without this checkbox being checked when SMS is selected.
                </p>

                {/* Mock consent checkbox */}
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Consent checkbox as shown on signup form:</p>
                  <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="mt-0.5 w-4 h-4 border-2 border-gray-400 rounded shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-700 rounded-sm opacity-0"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      I agree to receive SMS reminders from Huntley Band Boosters about
                      my volunteer shift. Up to 3 messages per signup. Message and data
                      rates may apply. Reply STOP to opt out. Reply HELP for help.
                      View our{' '}
                      <span className="text-red-700 underline">Privacy Policy</span>
                      {' '}and{' '}
                      <span className="text-red-700 underline">Terms of Service</span>.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">* Checkbox is unchecked by default. Volunteer must actively check it to proceed.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
              <div>
                <p className="font-semibold text-gray-900">Volunteer submits the form</p>
                <p className="text-gray-600 text-sm mt-1">
                  Upon submission, the volunteer receives a confirmation SMS immediately. They then receive up to 2 reminder SMS messages before their scheduled shift (72 hours before and 24 hours before).
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Message examples */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sample Messages</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Confirmation (sent immediately after signup):</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                Hi [First Name]! You're signed up for Tag Days 2026. Location: [Location Name]. Date: [Date], [Start Time]-[End Time]. Arrive at band room 20-30 min early. Go Raiders! - Huntley Band Boosters
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reminder 1 (72 hours before shift):</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                Reminder: Your Tag Days shift is coming up! [Date] at [Start Time], [Location Name]. Arrive at band room 20-30 min early. Reply STOP to opt out. - Huntley Band Boosters
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reminder 2 (24 hours before or day-of shift):</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                Tag Days reminder: Your shift is TODAY at [Start Time] at [Location Name]. Arrive at band room 20-30 min early. Go Raiders! - Huntley Band Boosters
              </div>
            </div>
          </div>
        </div>

        {/* Opt-out info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Opt-Out & Help Information</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>To opt out:</strong> Reply STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, OPTOUT, or REVOKE to any message.</p>
            <p><strong>Opt-out confirmation:</strong> You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.</p>
            <p><strong>For help:</strong> Reply HELP or INFO to any message.</p>
            <p><strong>Help response:</strong> Reply STOP to unsubscribe. Msg&Data Rates May Apply.</p>
            <p><strong>Message frequency:</strong> Up to 3 messages per volunteer signup.</p>
            <p><strong>Message and data rates may apply.</strong></p>
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Policy Documents</h2>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-red-700 underline text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-red-700 underline text-sm">Terms of Service</Link>
          </div>
        </div>

      </div>
    </main>
  )
}
