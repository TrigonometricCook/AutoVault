import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';
import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <main className="p-6">
         <ProtectedPageWrapper> 
         {children} 
        </ProtectedPageWrapper> 
      </main>
    </div>
  );
}
