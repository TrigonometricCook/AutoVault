'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UsernameLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // ✅ Step 1: Fetch email, role_id, and status from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, status, role_id, username')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      setError('User not found.');
      setLoading(false);
      return;
    }

    if (profile.status === 'disabled') {
      setError('Account is disabled.');
      setLoading(false);
      return;
    }

    // ✅ Step 2: Login using Supabase Auth (email + password)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (authError) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }

    // ✅ Step 3: Fetch role name using role_id
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('role_name')
      .eq('role_id', profile.role_id)
      .single();

    if (roleError || !roleData) {
      setError('Failed to fetch user role.');
      setLoading(false);
      return;
    }

    // ✅ Step 4: Store session-related data
    localStorage.setItem('loggedInUser', profile.username);
    localStorage.setItem('userId', profile.id);
    localStorage.setItem('roleName', roleData.role_name);

    console.log('✅ Login successful. Role:', roleData.role_name);

    // ✅ Step 5: Redirect based on role
    switch (roleData.role_name.toLowerCase()) {
      case 'admin':
        router.push('/pages/users');
        break;
      case 'manager':
        router.push('/pages/projects');
        break;
      case 'designer':
        router.push('/pages/components');
        break;
      default:
        setError('Unauthorized role.');
        break;
    }
  } catch (err: any) {
    setError(err.message || 'An unexpected error occurred.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
