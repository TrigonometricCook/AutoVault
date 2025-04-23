'use client';

import { useState } from 'react';
import AddUser from '@/components/AddUser';
import EditUser from '@/components/EditUser';
import UserTable from '@/components/UserTable';

export default function AddUserPage() {
  const [rightPane, setRightPane] = useState<'add' | { edit: any }>('add');

  const renderRightComponent = () => {
    if (rightPane === 'add') return <AddUser />;
    if (typeof rightPane === 'object' && 'edit' in rightPane) {
      return <EditUser user={rightPane.edit} onCancel={() => setRightPane('add')} />;
    }
    return null;
  };

  return (
    <div className="flex h-screen">
      <div className="w-7/10 max-h-[calc(100vh-6rem)] overflow-y-auto p-6 bg-gray-50 border-r">
        <UserTable onEditUser={(user) => setRightPane({ edit: user })} />
      </div>

      <div className="w-3/10 p-6 overflow-hidden">
        {renderRightComponent()}
      </div>
    </div>
  );
}
