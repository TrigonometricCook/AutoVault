'use client';

import { useState } from 'react';
import { handleAddUser } from '@/lib/adduser';

export default function AddUser() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    fullName: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = ['Admin', 'Manager', 'Designer'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    console.log('Submitting user data:', formData);
    const result = await handleAddUser(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        fullName: '',
      });
    }
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
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="w-full bg-white border px-4 py-2 rounded-md"
            value={formData.fullName}
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
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}
