'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const navItems = [
  
  { label: 'Components', href: '/pages/components' },
  { label: 'Assemblies', href: '/inventory' },
  { label: 'Projects', href: '/suppliers' },
  { label: 'Inventory', href: '/suppliers1' },
  { label: 'Marketplace', href: '/suppliers2' },
  { label: 'Users', href: '/pages/users' },

]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!mounted) return null

  return (
    <nav className="bg-[#001f3f] border-b border-blue-900 sticky top-0 z-50">
      <div className="max-w-8xl px-4 sm:px-6 lg:px-16 h-12 flex items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-white">
          <span className="text-yellow-400">Auto</span>Vault
        </Link>
        <div className="flex gap-6 items-center">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-300 hover:text-white transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  )
}
