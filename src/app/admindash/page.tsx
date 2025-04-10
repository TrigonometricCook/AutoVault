'use client';

import AddUser from '@/components/AddUser';
import UserTable from '@/components/UserTable';

export default function AddUserPage() {
  return (
    <div className="flex h-screen">
      {/* Left scrollable card list (70%) */}
      <div className="w-7/10 max-h-[calc(100vh-6rem)] overflow-y-auto p-6 bg-gray-50 border-r">
        <UserTable />
      </div>

      {/* Right fixed form (30%) */}
      <div className="w-3/10 p-6 overflow-hidden">
        <AddUser />
      </div>
    </div>
  );
}
