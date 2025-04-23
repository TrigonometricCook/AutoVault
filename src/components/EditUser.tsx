'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EditUserProps {
  user: {
    username: string;
    email: string;
    role: string;
    is_admin: boolean;
  };
  onCancel: () => void;
}

export default function EditUser({ user, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    role: user.role,
    isAdmin: user.is_admin,
    newPassword: '', // 🔐 New password field
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setFormData({
      username: user.username ?? '',
      email: user.email ?? '',
      role: user.role ?? '',
      isAdmin: user.is_admin ?? false,
      newPassword: '',
    });
  }, [user]);

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

    const { username, email, role, isAdmin, newPassword } = formData;

    if (!username || !email || !role) {
      setError('All fields are required.');
      return;
    }

    // Update user data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        email,
        role,
        is_admin: isAdmin,
      })
      .eq('username', user.username); // using username as primary key

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Update password if provided
    if (newPassword) {
      const { error: passwordError } = await supabase
        .from('profiles')
        .update({
          password: newPassword,
        })
        .eq('username', user.username);

      if (passwordError) {
        setError(passwordError.message);
        return;
      }
    }

    setSuccess('User updated successfully!');
  };

  return (
    <div className="bg-white flex justify-center items-start py-0">
      <div className="max-w-lg w-full mx-auto p-8 bg-[#003366] rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-center text-white">Edit User</h2>

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
            type="text"
            name="role"
            placeholder="Role"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.role}
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
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isAdmin"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
              className="accent-blue-600"
            />
            <label htmlFor="isAdmin" className="text-sm text-white">Admin Privileges</label>
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
