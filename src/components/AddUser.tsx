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
    role: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [roles, setRoles] = useState<{ role_id: number; role_name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) {
        console.error('Failed to fetch roles:', error.message);
        setError('Failed to load roles');
      } else {
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

    const { username, email, password, role, firstName, lastName, phoneNumber } = formData;

    if (!username || !email || !password || !role || !firstName || !lastName || !phoneNumber) {
      setError('All fields are required.');
      return;
    }

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

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create user.');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      username,
      email,
      password,
      role_id: parseInt(role),
    });

    if (profileError) {
      setError('User created, but failed to save profile.');
      return;
    }

    const { error: employeeError } = await supabase.from('employees').insert({
      employee_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phoneNumber,
      role_id: parseInt(role),
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
      role: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    });

    const { data: updatedSessionData } = await supabase.auth.getSession();
    setSession(updatedSessionData?.session);
  };

  return (
    <div className="bg-white flex justify-center items-start py-0">
      <div className="max-w-lg w-full mx-auto p-8 bg-[#003366] rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-center text-white">Add User</h2>

        <div className="space-y-6">
          <input type="text" name="username" placeholder="Username" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.username} onChange={handleChange} />
          <input type="email" name="email" placeholder="Email" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.email} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.password} onChange={handleChange} />
          <input type="text" name="firstName" placeholder="First Name" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.firstName} onChange={handleChange} />
          <input type="text" name="lastName" placeholder="Last Name" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.lastName} onChange={handleChange} />
          <input type="text" name="phoneNumber" placeholder="Phone Number" className="w-full bg-white border px-4 py-2 rounded-md" value={formData.phoneNumber} onChange={handleChange} />

          {/* Dynamic Role Selection */}
          <div className="space-y-2">
            <label className="text-white font-medium block">Select Role:</label>
            {roles.map((r) => (
              <div key={r.role_id} className="flex items-center space-x-2">
                <input type="radio" name="role" value={r.role_id} id={`role-${r.role_id}`} checked={formData.role === r.role_id.toString()} onChange={handleChange} />
                <label htmlFor={`role-${r.role_id}`} className="text-white">{r.role_name}</label>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button onClick={handleSubmit} className="w-full bg-white text-[#003366] py-2 rounded-md hover:bg-gray-200 transition duration-300">
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}
