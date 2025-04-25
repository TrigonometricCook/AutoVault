import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, RefreshCcw, ArrowDownCircle, Filter, Edit2, Trash } from 'lucide-react';

type UserData = {
  username: string;
  email: string;
  role: string;
  full_name: string;
};

type UserTableProps = {
  onEditUser: (user: UserData) => void;
};

export default function UserTable({ onEditUser }: UserTableProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'email'>('username');
  const [filterBy, setFilterBy] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Perform a raw SQL query to fetch users
      const { data, error } = await supabase
        .rpc('execute_sql', {
          query: `
            SELECT 
              employees.username,
              employees.full_name, 
              profiles.email,
              roles.role_name
            FROM 
              employees
            JOIN profiles ON employees.username = profiles.username
            JOIN roles ON employees.role_id = roles.role_id;
          `
        });

      if (error) throw error;

      // Format the data to match UserData
      const formatted = data.map((user: any) => ({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name || 'Unknown',  // Default to 'Unknown' if role is not found
      }));

      setUsers(formatted);  // Update the state with the fetched data
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
      // Perform raw SQL query to delete user from both tables (employees and profiles)
      const { error: employeeError } = await supabase
        .rpc('execute_sql', {
          query: `
            DELETE FROM employees WHERE username = $1;
            DELETE FROM profiles WHERE username = $1;
          `,
          parameters: [username],
        });

      if (employeeError) throw employeeError;

      setUsers(users.filter(user => user.username !== username)); // Remove user from state
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = fetchUsers;

  const filteredUsers = users
    .filter((user) => {
      if (filterBy === 'all') return true;
      return user.role.toLowerCase() === filterBy.toLowerCase();
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
      <div className="bg-[#003366] text-white p-4 rounded-t-xl rounded-b-xl flex items-center shadow-lg w-full max-w-5xl mx-auto">
        <input
          type="text"
          placeholder="Search by username..."
          className="flex-grow h-10 pl-4 rounded-l-lg rounded-r-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-4 ml-4">
          <button onClick={handleRefresh} className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]">
            <RefreshCcw className="w-6 h-6" />
          </button>
          <button onClick={() => setSortBy(sortBy === 'username' ? 'email' : 'username')} className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]">
            <ArrowDownCircle className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              const next = filterBy === 'all' ? 'admin' : filterBy === 'admin' ? 'user' : 'all';
              setFilterBy(next);
            }}
            className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
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
              <button className="p-2 rounded-lg bg-transparent text-gray-600" onClick={() => onEditUser(user)}>
                <Edit2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-transparent text-red-600" onClick={() => handleDelete(user.username)}>
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
