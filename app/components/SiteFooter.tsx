import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400 py-6 px-4 mt-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <div>
          <p className="font-semibold text-white">HHS Band Boosters</p>
          <p>Huntley High School · Huntley, IL</p>
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms</Link>
          <a href="mailto:fundraising@huntleybands.com" className="hover:text-white transition">Contact</a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        © {year} Huntley High School Band Boosters. All rights reserved.
      </div>
    </footer>
  )
}
