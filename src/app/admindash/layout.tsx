import AdminProtectedPageWrapper from '@/components/AdminProtectedPageWrapper';
import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <main className="p-6">
         
         {children} 
        
      </main>
    </div>
  );
}
