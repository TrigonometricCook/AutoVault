import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, User, RefreshCcw, ArrowDownCircle, Filter, Edit2, Trash } from 'lucide-react';

export default function UserTable() {
  const [users, setUsers] = useState<Array<{ id: any; username: any; email: any; is_admin: any }>>([]);
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
          .select('id, username, email, is_admin');

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
        .select('id, username, email, is_admin');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return; // If the user cancels, exit the function

    setLoading(true);
    setError('');
    try {
      // Delete user from the profiles table
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) throw deleteProfileError;

      // Successfully deleted, now refresh the user list
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filterBy === 'admin') return user.is_admin;
    if (filterBy === 'user') return !user.is_admin;
    return true; // Show all users
  }).filter((user) => {
    return user.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    if (sortBy === 'username') {
      return a.username.localeCompare(b.username);
    }
    return a.email.localeCompare(b.email);
  });

  if (loading) return <p className="text-center text-xl font-semibold">Loading users...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Navbar-like bar at the top */}
      <div className="bg-[#003366] text-white p-4 rounded-t-xl rounded-b-xl flex items-center shadow-lg w-full max-w-5xl mx-auto">
        {/* Search bar taking up the rest of the space */}
        <input
          type="text"
          placeholder="Search by username..."
          className="flex-grow h-10 pl-4 rounded-l-lg rounded-r-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Right-aligned icon buttons */}
        <div className="flex gap-4 ml-4">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>

          {/* Sort Button as Icon */}
          <button
            onClick={() => setSortBy(sortBy === 'username' ? 'email' : 'username')}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <ArrowDownCircle className="w-6 h-6" />
          </button>

          {/* Filter Button as Icon */}
          <button
            onClick={() => setFilterBy(filterBy === 'all' ? 'admin' : filterBy === 'admin' ? 'user' : 'all')}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* User list in a 2-column grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedUsers.map((user) => (
          <div
            key={user.id}
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
              {/* Username with overflow handling */}
              <div className="font-semibold text-lg text-gray-800 truncate w-full overflow-hidden">{user.username}</div>
              {/* Email with overflow handling */}
              <div className="text-sm text-gray-600 truncate w-full overflow-hidden">{user.email}</div>
              <div className="text-sm mt-2 text-gray-500">
                {user.is_admin ? 'Admin' : 'User'}
              </div>
            </div>

            {/* Icon buttons for edit and delete */}
            <div className="flex gap-3">
              <button className="p-2 rounded-lg bg-transparent text-gray-600">
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg bg-transparent text-red-600"
                onClick={() => handleDelete(user.id)}
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
