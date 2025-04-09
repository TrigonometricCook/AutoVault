import Navbar from '@/components/Navbar';
import AdminNavbar from '@/components/Navbar';
import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
