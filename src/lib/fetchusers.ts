// lib/useUsers.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserData = {
  username: string;
  email: string;
  role: string;
  full_name: string;
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
          roles (
            role_name
          )
        `);

      if (error) throw error;

      const formatted = data.map((user: any) => ({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.roles?.role_name || 'Unknown',
      }));

      setUsers(formatted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (username: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('username', username);

      if (error) throw error;

      setUsers((prev) => prev.filter((user) => user.username !== username));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
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
