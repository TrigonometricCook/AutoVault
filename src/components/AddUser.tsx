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
    confirmPassword: '', // New confirm password field
    role: '',
    fullName: '', // Combined first and last name
  });

  const [roles, setRoles] = useState<{ role_id: number; role_name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  // Fetch roles and session
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase.from('roles').select('role_id, role_name');
      if (!error && data) {
        setRoles(data);
      }
    };

    const getSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData?.session || null);
    };

    fetchRoles();
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

    const { username, email, password, confirmPassword, role, fullName } = formData;

    // Validate that all fields are filled
    if (!username || !email || !password || !confirmPassword || !role || !fullName) {
      setError('All fields are required.');
      return;
    }

    // Validate that password and confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check if username already exists
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

    // Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create user.');
      return;
    }

    const roleId = parseInt(role);
    const employeeId = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    const userId = authData.user.id; // Get the user ID from the Auth data

    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      username,
      password,
      email,
      user_id: userId, // Include the user_id from Supabase Auth
    });

    if (profileError) {
      setError('User created, but failed to save profile.');
      return;
    }

    // Insert into employees (with full_name instead of first_name and last_name)
    const { error: employeeError } = await supabase.from('employees').insert({
      employee_id: employeeId,
      full_name: fullName, // Use fullName instead of first and last name
      role_id: roleId,
      username,
    });

    if (employeeError) {
      setError('User created, but failed to save employee details.');
      return;
    }

    setSuccess('User added successfully!');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '', // Reset confirmPassword
      role: '',
      fullName: '', // Reset fullName
    });

    const { data: updatedSessionData } = await supabase.auth.getSession();
    setSession(updatedSessionData?.session);
  };

  return (
    <div className="bg-white flex justify-center items-start py-0">
      <div className="max-w-lg w-full mx-auto p-8 bg-[#003366] rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-center text-white">Add User</h2>

        <div className="space-y-6">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.fullName}
            onChange={handleChange}
          />

          {/* Dynamic role selection */}
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.role_id} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={r.role_id}
                  id={`role-${r.role_id}`}
                  checked={formData.role === r.role_id.toString()}
                  onChange={handleChange}
                />
                <label htmlFor={`role-${r.role_id}`} className="text-white ml-2">{r.role_name}</label>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-white text-[#003366] py-2 rounded-md hover:bg-gray-200 transition duration-300"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}
