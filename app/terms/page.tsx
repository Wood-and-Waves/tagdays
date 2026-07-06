import Link from 'next/link'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader
        title="Terms of Service"
        subtitle="Huntley High School Band Boosters"
        rightLinkHref="/"
        rightLinkLabel="Back to Schedule"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-500 text-sm mb-6">Last updated: June 2026</p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Volunteer Agreement</h2>
          <p className="text-gray-600 mb-4">
            By signing up for a Tag Days volunteer shift, you agree to arrive at
            your assigned location on time and fulfill your commitment to the
            Huntley High School Band Boosters fundraiser.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">SMS Terms</h2>
          <p className="text-gray-600 mb-4">
            By providing your phone number and selecting SMS as a reminder preference,
            you consent to receive text messages from Huntley Band Boosters regarding
            your volunteer shift. Message frequency is up to 3 messages per signup.
            Message and data rates may apply. Reply STOP to unsubscribe at any time.
            Reply HELP for help.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Cancellations</h2>
          <p className="text-gray-600 mb-4">
            If you need to cancel your shift, please contact us as soon as possible
            at{' '}
            <a href="mailto:fundraising@huntleybands.com" className="text-brand-700 underline">
              fundraising@huntleybands.com
            </a>{' '}
            so we can find a replacement volunteer.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            Huntley Band Boosters is not responsible for any damages or losses
            arising from participation in the Tag Days fundraiser. Volunteers
            participate at their own risk.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-gray-600">
            Questions? Contact us at{' '}
            <a href="mailto:fundraising@huntleybands.com" className="text-brand-700 underline">
              fundraising@huntleybands.com
            </a>
          </p>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
