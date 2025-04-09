'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, is_admin');

        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 border-b">Username</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{user.username}</td>
                  <td className="px-4 py-2 border-b">{user.email}</td>
                  <td className="px-4 py-2 border-b">
                    {user.is_admin ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
