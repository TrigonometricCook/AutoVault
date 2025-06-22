import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserData = {
  username: string;
  email: string;
  role: string;
  full_name: string;
  status: 'active' | 'disabled';
};

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          username,
          email,
          full_name,
          status,
          roles (
            role_name
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const formatted = data.map((user: any) => ({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        status: user.status,
        role: user.roles?.role_name || 'Unknown',
      }));

      setUsers(formatted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (targetUsername: string, actorUsername: string) => {
    try {
      // 1. Fetch the ID of the user being disabled
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', targetUsername)
        .single();

      if (fetchError) throw fetchError;
      const recordId = profileData.id;

      // 2. Update status to 'disabled'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'disabled' })
        .eq('username', targetUsername);

      if (updateError) throw updateError;

      // 3. Insert into audit_log manually
      const { error: logError } = await supabase.from('audit_log').insert([
        {
          table_name: 'profiles',
          record_id: recordId,
          action_type: 'disable',
          username: actorUsername,
        },
      ]);

      if (logError) throw logError;

      // 4. Remove from local state
      setUsers((prev) =>
        prev.filter((user) => user.username !== targetUsername)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to disable user.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    deleteUser,
  };
}
