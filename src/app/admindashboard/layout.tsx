import AdminNavbar from '@/components/AdminNavbar';
import AdminProtectedPageWrapper from '@/components/AdminProtectedPageWrapper';
import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <AdminNavbar />
      <main className="p-6">
         <AdminProtectedPageWrapper> 
         {children} 
        </AdminProtectedPageWrapper> 
      </main>
    </div>
  );
}
