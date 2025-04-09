'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProtectedPageWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/userauth/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (error || !profile?.is_admin) {
        await supabase.auth.signOut()
        router.replace('/userauth/login')
        return
      }

      setIsAuthorized(true)
      setChecking(false)
    }

    checkAuth()
  }, [router])

  if (checking) return null // or a loader

  return <>{isAuthorized && children}</>
}
