'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProtectedPageWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/userauth/login'); // or /userauth/login
      }
    };

    checkSession();
  }, [router]);

  return <>{children}</>;
}
