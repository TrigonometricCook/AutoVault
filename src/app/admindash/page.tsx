'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Using the client-side environment variables with NEXT_PUBLIC_ prefix
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const { username, email, password, isAdmin } = formData;

    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }

    // Check if the username already exists (using public key)
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username);

    if (checkError) {
      setError('Error checking username.');
      return;
    }

    if (existing && existing.length > 0) {
      setError('Username already taken.');
      return;
    }

    // Create user with public API (this is safe for demo)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create user.');
      return;
    }

    // Insert user into profiles table (use public key)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      username,
      is_admin: isAdmin,
    });

    if (profileError) {
      setError('User created, but failed to save profile.');
      return;
    }

    setSuccess('User added successfully!');
    setFormData({
      username: '',
      email: '',
      password: '',
      isAdmin: false,
    });
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Add User</h2>

      <div className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="w-full border px-3 py-2 rounded"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isAdmin"
            id="isAdmin"
            checked={formData.isAdmin}
            onChange={handleChange}
            className="accent-blue-600"
          />
          <label htmlFor="isAdmin" className="text-sm">Grant Admin Privileges</label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
    </div>
  );
}
