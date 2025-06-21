'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Props = {
  children: React.ReactNode;
  requiredPermission?: keyof {
    can_manage_employees: boolean;
    can_manage_projects: boolean;
    can_manage_designs: boolean;
  };
};

export default function SessionRedirector({ children, requiredPermission }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user?.email) {
        console.warn('🚫 No session, redirecting to login...');
        router.replace('/');
        return;
      }

      const email = session.user.email;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        console.warn('🚫 No profile found');
        router.replace('/');
        return;
      }

      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('can_manage_employees, can_manage_projects, can_manage_designs')
        .eq('role_id', profile.role_id)
        .single();

      if (roleError || !role) {
        console.warn('🚫 Role not found');
        router.replace('/');
        return;
      }

      if (requiredPermission && !role[requiredPermission]) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }

      setLoading(false);
    };

    checkSession();
  }, [requiredPermission, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) return null;

  if (!authorized) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">You do not have permission to view this page.</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout and Return to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
