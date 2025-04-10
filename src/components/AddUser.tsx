'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddUser() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    isAdmin: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  // Check for session on component mount
  useEffect(() => {
    const getSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
    };

    getSession();
  }, [router]);

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

    const { username, email, password, confirmPassword, role, isAdmin } = formData;

    if (!username || !email || !password || !confirmPassword || !role) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check if the username already exists
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

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create user.');
      return;
    }

    // Insert user into profiles table
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

    // Set success message
    setSuccess('User added successfully!');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      isAdmin: false,
    });

    // Refresh session after user is added
    const { data: updatedSessionData } = await supabase.auth.getSession();
    setSession(updatedSessionData?.session);
  };

  return (
    <div className="bg-white flex justify-center items-start py-0">
      {/* Outer container with fixed width and center alignment */}
      <div className="max-w-lg w-full mx-auto p-8 bg-[#003366] rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-center text-white">Add User</h2>

        <div className="space-y-6">
          {/* Text fields with white background */}
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full bg-white border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={formData.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full bg-white border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full bg-white border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full bg-white border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          {/* Role text field with white background */}
          <input
            type="text"
            name="role"
            placeholder="Role (e.g., Admin or User)"
            className="w-full bg-white border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={formData.role}
            onChange={handleChange}
          />

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isAdmin"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
              className="accent-blue-600"
            />
            <label htmlFor="isAdmin" className="text-sm text-white">Grant Admin Privileges</label>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-white text-[#003366] py-2 rounded-md hover:bg-gray-200 transition duration-300 ease-in-out"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}
