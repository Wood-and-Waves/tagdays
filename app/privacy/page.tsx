export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-red-200 mt-1">Huntley High School Tag Days 2026</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 prose prose-gray">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-500 text-sm mb-6">Last updated: June 2026</p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            When you sign up to volunteer for Tag Days, we collect your first and last name,
            email address, and optionally your phone number and reminder preference.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use your information solely to manage volunteer shift signups and send
            reminders about your scheduled shift. We do not use your information for
            any other purpose.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">SMS Messaging</h2>
          <p className="text-gray-600 mb-4">
            If you opt in to SMS reminders, you will receive a confirmation message
            when you sign up and up to 2 reminder messages before your shift.
            Message frequency is up to 3 messages per signup. Message and data rates
            may apply. Reply STOP to opt out at any time. Reply HELP for assistance.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">We Do Not Share Your Information</h2>
          <p className="text-gray-600 mb-4">
            We will never sell, share, or rent your personal information or mobile
            phone number to any third party for marketing purposes. Your phone number
            is used only to send shift reminders through our messaging service.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Data Retention</h2>
          <p className="text-gray-600 mb-4">
            Your signup information is retained only for the duration of the Tag Days
            event and will be deleted within 30 days after the event concludes.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-gray-600">
            Questions about this privacy policy? Contact us at{' '}
            <a href="mailto:fundraising@huntleybands.com" className="text-red-700 underline">
              fundraising@huntleybands.com
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
