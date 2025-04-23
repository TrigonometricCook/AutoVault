import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, User, RefreshCcw, ArrowDownCircle, Filter, Edit2, Trash } from 'lucide-react';

type UserData = {
  username: string;
  email: string;
  is_admin: boolean;
  role: string;
};

type UserTableProps = {
  onEditUser: (user: UserData) => void;
};

export default function UserTable({ onEditUser }: UserTableProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'email'>('username');
  const [filterBy, setFilterBy] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, email, is_admin, role');

        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, is_admin, role');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    setLoading(true);
    setError('');
    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('username', username);

      if (deleteError) throw deleteError;

      setUsers(users.filter(user => user.username !== username));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      if (filterBy === 'admin') return user.is_admin;
      if (filterBy === 'user') return !user.is_admin;
      return true;
    })
    .filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedUsers = filteredUsers.sort((a, b) => {
    return sortBy === 'username'
      ? a.username.localeCompare(b.username)
      : a.email.localeCompare(b.email);
  });

  if (loading) return <p className="text-center text-xl font-semibold">Loading users...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="bg-[#003366] text-white p-4 rounded-t-xl rounded-b-xl flex items-center shadow-lg w-full max-w-5xl mx-auto">
        <input
          type="text"
          placeholder="Search by username..."
          className="flex-grow h-10 pl-4 rounded-l-lg rounded-r-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-4 ml-4">
          <button
            onClick={handleRefresh}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
          <button
            onClick={() =>
              setSortBy(sortBy === 'username' ? 'email' : 'username')
            }
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <ArrowDownCircle className="w-6 h-6" />
          </button>
          <button
            onClick={() =>
              setFilterBy(
                filterBy === 'all'
                  ? 'admin'
                  : filterBy === 'admin'
                  ? 'user'
                  : 'all'
              )
            }
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedUsers.map((user) => (
          <div
            key={user.username}
            className="flex items-center gap-6 border border-gray-200 rounded-2xl p-6 shadow-lg bg-white hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
              {user.is_admin ? (
                <ShieldCheck className="w-10 h-10 text-blue-600" />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>

            <div className="flex-1 max-w-full">
              <div className="font-semibold text-lg text-gray-800 truncate w-full">
                {user.username}
              </div>
              <div className="text-sm text-gray-600 truncate w-full">
                {user.email}
              </div>
              <div className="text-sm mt-2 text-gray-500">
                {user.is_admin ? 'Admin' : user.role}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="p-2 rounded-lg bg-transparent text-gray-600"
                onClick={() => onEditUser(user)}
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
