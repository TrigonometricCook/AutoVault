'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EditUserProps {
  user: {
    username: string;
    email: string;
    role_id: number;
    full_name: string;
  } | null;
  onCancel: () => void;
}

export default function EditUser({ user, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role_id: '',
    full_name: '',
    newPassword: '',
  });

  const [roles, setRoles] = useState<{ role_id: number; role_name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role_id: user.role_id ? user.role_id.toString() : '',
        full_name: user.full_name,
        newPassword: '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchRoles = async () => {
      // Fetch roles using RPC to execute raw SQL
      const { data, error } = await supabase.rpc('fetch_roles'); // This calls a stored procedure for raw SQL query
      if (error) {
        console.error('Error fetching roles:', error);
      } else {
        setRoles(data);
      }
    };
    fetchRoles();
  }, []);

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

    const { username, email, full_name, role_id, newPassword } = formData;

    if (!username || !email || !role_id || !full_name) {
      setError('All fields except password are required.');
      return;
    }

    try {
      // Update password in Supabase Auth (optional)
      if (newPassword) {
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (authError) {
          setError('Failed to update password.');
          return;
        }
      }

      // Update email using raw SQL via RPC
      const { error: profileError } = await supabase.rpc('update_user_email', {
        username: username,
        email: email,
      });

      if (profileError) {
        setError('Failed to update email.');
        return;
      }

      // Update role_id and full_name using raw SQL via RPC
      const { error: employeeError } = await supabase.rpc('update_employee', {
        username: username,
        role_id: parseInt(role_id),
        full_name: full_name,
      });

      if (employeeError) {
        setError('Failed to update employee.');
        return;
      }

      setSuccess('User updated successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white flex justify-center items-start py-0">
      <div className="max-w-lg w-full mx-auto p-8 bg-[#003366] rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-center text-white">Edit User</h2>

        <div className="space-y-6">
          <input
            type="text"
            name="username"
            disabled
            className="w-full bg-gray-200 border px-4 py-2 rounded-md"
            value={formData.username}
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
            type="text"
            name="full_name"
            placeholder="Full Name"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.full_name}
            onChange={handleChange}
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password (leave blank to keep current)"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.newPassword}
            onChange={handleChange}
          />

          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.role_id} className="flex items-center">
                <input
                  type="radio"
                  name="role_id"
                  value={r.role_id.toString()}
                  id={`role-${r.role_id}`}
                  checked={formData.role_id === r.role_id.toString()}
                  onChange={handleChange}
                />
                <label htmlFor={`role-${r.role_id}`} className="text-white ml-2">
                  {r.role_name}
                </label>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-white text-[#003366] py-2 rounded-md hover:bg-gray-200"
          >
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-300 text-[#003366] py-2 rounded-md hover:bg-gray-400 mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
