'use client';

import { useState } from 'react';
import { useUsers, UserData } from '@/lib/fetchusers';
import { User, RefreshCcw, ArrowDownCircle, Filter, Edit2, Trash } from 'lucide-react';

type UserTableProps = {
  onEditUser: (user: UserData) => void;
};

export default function UserTable({ onEditUser }: UserTableProps) {
  const { users, loading, error, fetchUsers, deleteUser } = useUsers();
  const [sortBy, setSortBy] = useState<'username' | 'email'>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDelete = async (username: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (confirmDelete) {
      await deleteUser(username);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      if (filterBy === 'all') return true;
      return user.role.toLowerCase() === filterBy.toLowerCase();
    })
    .filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedUsers = filteredUsers.sort((a, b) => {
    const fieldA = sortBy === 'username' ? a.username : a.email;
    const fieldB = sortBy === 'username' ? b.username : b.email;

    const comparison = fieldA.localeCompare(fieldB);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = () => {
    if (sortBy === 'username') {
      setSortBy('email');
      setSortDirection('asc'); // reset direction
    } else {
      setSortBy('username');
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  if (loading) return <p className="text-center text-xl font-semibold">Loading users...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="bg-[#003366] text-white p-4 rounded-t-xl rounded-b-xl flex items-center shadow-lg w-full max-w-5xl mx-auto">
        <input
          type="text"
          placeholder="Search by username..."
          className="flex-grow h-10 pl-4 rounded-l-lg rounded-r-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-4 ml-4">
          <button onClick={fetchUsers} className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]">
            <RefreshCcw className="w-6 h-6" />
          </button>
          <button
            onClick={toggleSort}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
            title={`Sort by ${sortBy === 'username' ? 'email' : 'username'}`}
          >
            <ArrowDownCircle className="w-6 h-6 transform transition-transform duration-300"
              style={{
                transform: sortDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          </button>
          <button
            onClick={() => {
              const next = filterBy === 'all' ? 'admin' : filterBy === 'admin' ? 'staff' : 'all';
              setFilterBy(next);
            }}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
            title={`Filter: ${filterBy}`}
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedUsers.map((user) => (
          <div
            key={user.username}
            className="flex items-center gap-6 border border-gray-200 rounded-2xl p-6 shadow-lg bg-white hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
              <User className="w-10 h-10 text-gray-500" />
            </div>

            <div className="flex-1 max-w-full">
              <div className="font-semibold text-lg text-gray-800 truncate w-full">
                {user.username}
              </div>
              <div className="text-sm text-gray-600 truncate w-full">
                {user.email}
              </div>
              <div className="text-sm mt-2 text-gray-500">
                {user.role}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="p-2 rounded-lg bg-transparent text-gray-600"
                onClick={() => {
                  console.log('Editing user:', user);
                  onEditUser(user);
                }}
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg bg-transparent text-red-600"
                onClick={() => handleDelete(user.username)}
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
