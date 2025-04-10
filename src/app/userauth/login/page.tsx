'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      // Step 1: Check if the user exists in the profiles table
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('email, is_admin')
        .eq('username', username)
        .single();

      if (fetchError || !profile?.email) {
        setError('Invalid username');
        setLoading(false);
        return;
      }

      // Step 2: Check if the user is an admin (admin users can't log in here)
      if (profile.is_admin) {
        setError('This is an Admin Account: Please Log in as an Admin');
        setLoading(false);
        return;
      }

      const email = profile.email;

      // Step 3: Login with email + password
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      // Step 4: Redirect to user dashboard
      router.push('/userdashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">User Login</h1>
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
      <div className="mt-4 text-sm text-center text-gray-600">
        <Link href="/userauth/adminlogin" className="text-blue-600 hover:underline">
          Login as admin?
        </Link>
      </div>
    </div>
  );
}
