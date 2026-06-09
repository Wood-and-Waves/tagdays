'use client'

import { useState } from 'react'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/locations', label: 'Locations' },
  { href: '/admin/slots', label: 'Slots' },
  { href: '/admin/signups', label: 'Signups' },
  { href: '/admin/roster', label: 'Roster' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/config', label: 'Settings' },
]

export default function AdminNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-red-400">Tag Days Admin</span>

        <div className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <a key={link.href} href={link.href} className="text-sm hover:text-red-400 transition">
              {link.label}
            </a>
          ))}
          <a href="/admin/logout" className="text-sm text-gray-400 hover:text-white transition">
            Sign Out
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white focus:outline-none">
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-700 px-6 py-4 flex flex-col gap-4">
          {links.map(link => (
            <a key={link.href} href={link.href} className="text-sm hover:text-red-400 transition" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="/admin/logout" className="text-sm text-gray-400 hover:text-white transition" onClick={() => setOpen(false)}>
            Sign Out
          </a>
        </div>
      )}
    </nav>
  )
}