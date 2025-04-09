'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function IsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError('Not logged in');
        setIsAdmin(null);
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError || !data) {
        setError('Could not fetch profile');
        setIsAdmin(null);
      } else {
        setIsAdmin(data.is_admin);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  if (loading) return <p>Checking...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Admin Check</h1>
      {isAdmin ? (
        <p className="text-green-600 font-medium">✅ You are an admin.</p>
      ) : (
        <p className="text-yellow-600 font-medium">❌ You are not an admin.</p>
      )}
    </div>
  );
}
