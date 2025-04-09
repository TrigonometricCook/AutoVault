import AdminNavbar from '@/components/AdminNavbar';
import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <AdminNavbar />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
