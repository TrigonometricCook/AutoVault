'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import SessionRedirector from '@/components/SessionRedirector';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Only public (unauthenticated) pages render outside the session wrapper
  const isProtectedRoute = pathname.startsWith('/pages');

  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        {isProtectedRoute ? (
          <>
            <AdminNavbar />
            <main className="p-0">
              <SessionRedirector>
                {children}
              </SessionRedirector>
            </main>
          </>
        ) : (
          // For login page or public route
          <main className="p-0">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
