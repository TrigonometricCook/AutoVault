'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SessionRedirector() {
  const router = useRouter();

  useEffect(() => {
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
        router.replace('/admindashboard');
      } else {
        router.replace('/userdashboard');
      }
    };

    checkAndRedirect();
  }, [router]);

  return null;
}
