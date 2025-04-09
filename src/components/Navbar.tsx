'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { label: 'Part Library', href: '/parts' },
  { label: 'Projects', href: '/projects' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Suppliers', href: '/suppliers' },
  { label: 'Settings', href: '/settings' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // wait until client hydration

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-gray-900">
          <span className="text-blue-600">Part</span>Keep
        </Link>
        <div className="flex gap-6 items-center">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
