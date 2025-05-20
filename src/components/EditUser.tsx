'use client';

import { useState, useEffect } from 'react';
import { handleEditUser, EditUserPayload } from '@/lib/edituser';

interface EditUserProps {
  user: {
    username: string;
    email: string;
    full_name: string;
    role: string;
  } | null;
  onCancel: () => void;
}

export default function EditUser({ user, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    full_name: '',
    newPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = ['Admin', 'Manager', 'Designer'];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        newPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const { username, email, full_name, role, newPassword } = formData;

    if (!username || !email || !role || !full_name) {
      setError('All fields except password are required.');
      return;
    }

    const payload: EditUserPayload = {
      username,
      email,
      full_name,
      role,
      newPassword: newPassword || undefined,
    };

    const result = await handleEditUser(payload);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success ?? '');
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
            type="text"
            name="full_name"
            placeholder="Full Name"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.full_name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            disabled
            placeholder="Email"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password (optional)"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.newPassword}
            onChange={handleChange}
          />

          <div className="flex w-full gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium transition ${
                  formData.role === role
                    ? 'bg-white text-[#003366] border-white'
                    : 'bg-[#003366] text-white border-white hover:bg-white hover:text-[#003366]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 text-[#003366] py-2 rounded-md font-semibold hover:bg-yellow-300 transition duration-300"
          >
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-300 text-[#003366] py-2 rounded-md font-semibold hover:bg-gray-400 transition duration-300 mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
