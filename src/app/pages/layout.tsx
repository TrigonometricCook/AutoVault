import { ReactNode } from 'react';

export default function AdminPage({ children }: { children: ReactNode }) {
  return (
    <div>
      <main className="p-0">
         {children}         
      </main>
    </div>
  );
}