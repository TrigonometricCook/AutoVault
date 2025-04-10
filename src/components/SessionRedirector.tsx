'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SessionRedirector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on the root route
    if (pathname !== '/') return;

    const checkAndRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/userauth/login');
        return;
      }

      const userId = session.user.id;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        router.replace('/userauth/login');
        return;
      }

      if (profile.is_admin) {
        router.replace('/admindash');
      } else {
        router.replace('/userdashboard');
      }
    };

    checkAndRedirect();
  }, [router, pathname]);

  return null;
}
