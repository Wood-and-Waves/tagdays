import Link from 'next/link'

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">What is Tag Days?</h1>
            <p className="text-red-200 mt-1">Huntley High School Band Boosters</p>
          </div>
          <Link href="/" className="text-sm underline text-red-200 hover:text-white">
            Back to Schedule
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What is Tag Days?</h2>
            <p className="text-gray-600">
              Tag Days is a fundraising event where band students stand outside local businesses
              wearing spirit wear and playing music to solicit donations. Customers love the music
              and drop coins and dollars into our buckets. In exchange for their donations, students
              hand them a "tag" thanking them for supporting our band program.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What do I need to do?</h2>
            <p className="text-gray-600">
              Sign up for at least 2 time slots over the 3-day event (4 hours total) if you are
              a Marching Band or Color Guard member. Curricular band members are encouraged to
              sign up for at least one 2-hour slot. Sign up with friends from your section or
              mix it up!
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What should I play?</h2>
            <p className="text-gray-600">
              Play scales, a solo piece, or anything you played during the year. Customers just
              want to hear you play! Color Guard should wave flags with musicians or bring music
              to wave to. The more entertaining, the more donations you'll collect. Ask Mr. Guthrie
              for sheet music and suggestions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What about parents?</h2>
            <p className="text-gray-600">
              We require 1 parent or adult supervisor at each location during Tag Days for the
              safety and protection of our students. Parents are also responsible for collecting
              donations and returning money to the band room at the end of each shift. Students
              will NOT be responsible for transporting money.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What are the day-of instructions?</h2>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Arrive at the band room 20–30 minutes before your post time</li>
              <li>Check in and grab your instruments</li>
              <li>Get instructions from team leaders before heading to your post</li>
              <li>Volunteers are responsible for getting themselves to and from their posts</li>
              <li>Anyone needing a ride should inquire ahead of time</li>
              <li>At the end of your shift, return to the band room to sign out</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">What about QR code donations?</h2>
            <p className="text-gray-600">
              Many people don't carry cash so we have QR codes that go directly to our PayPal
              or Venmo accounts. Give every customer the opportunity to donate digitally!
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Questions?</h2>
            <p className="text-gray-600">
              Contact Amy Koegel at{' '}
              <a href="mailto:fundraising@huntleybands.com" className="text-red-700 underline">
                fundraising@huntleybands.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
