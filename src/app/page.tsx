'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto mt-16 text-center space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">Welcome to PartKeep</h1>
      <p className="text-gray-600">
        This is your central hub for managing CAD parts and project inventories.
      </p>

      <div className="flex justify-center gap-4 mt-6">
        <Link
          href="/userauth/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          Login
        </Link>
        <Link
          href="/userauth/signup"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}
