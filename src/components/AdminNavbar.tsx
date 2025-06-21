'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Permissions = {
  can_manage_employees: boolean;
  can_manage_projects: boolean;
  can_manage_designs: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      // 1. Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error('❌ No active session:', sessionError);
        router.push('/');
        return;
      }

      const userEmail = session.user.email;
      console.log('🔐 Supabase session email:', userEmail);

      // 2. Fetch profile by email to get role_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('email', userEmail)
        .single();

      if (profileError || !profile) {
        console.error('❌ Failed to fetch profile:', profileError);
        router.push('/');
        return;
      }

      const roleId = profile.role_id;
      console.log('✅ Fetched role_id:', roleId);

      // 3. Fetch role permissions
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('can_manage_employees, can_manage_projects, can_manage_designs')
        .eq('role_id', roleId)
        .single();

      if (roleError || !role) {
        console.error('❌ Failed to fetch role permissions:', roleError);
        router.push('/');
        return;
      }

      console.log('✅ Role permissions:', role);

      setPermissions({
        can_manage_employees: role.can_manage_employees,
        can_manage_projects: role.can_manage_projects,
        can_manage_designs: role.can_manage_designs,
      });

      setMounted(true);
    };

    fetchPermissions();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!mounted || !permissions) return null;

  return (
    <nav className="bg-[#001f3f] border-b border-blue-900 sticky top-0 z-50">
      <div className="max-w-8xl px-4 sm:px-6 lg:px-16 h-12 flex items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-white">
          <span className="text-yellow-400">Auto</span>Vault
        </Link>
        <div className="flex gap-6 items-center">
          {permissions.can_manage_designs && (
            <>
              <Link
                href="/pages/components"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/pages/components'
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Components
              </Link>
              <Link
                href="/pages/assemblies"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/pages/assemblies'
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Assemblies
              </Link>
            </>
          )}
          {permissions.can_manage_projects && (
            <Link
              href="/pages/projects"
              className={`text-sm font-medium transition-colors ${
                pathname === '/pages/projects'
                  ? 'text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Projects
            </Link>
          )}
          {permissions.can_manage_employees && (
            <Link
              href="/pages/users"
              className={`text-sm font-medium transition-colors ${
                pathname === '/pages/users'
                  ? 'text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Users
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-300 hover:text-white transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
