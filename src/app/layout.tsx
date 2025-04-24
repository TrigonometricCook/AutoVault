'use client'

import "./globals.css";
import SessionRedirector from '@/components/SessionRedirector';
import { usePathname } from 'next/navigation';
import Navbar from "../components/Navbar";
import AdminNavbar from "@/components/AdminNavbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!pathname.startsWith('/pages')) {
    return (
      <html lang="en">
        <body className="antialiased bg-white text-black">
          <main className="p-4">
            {children}
          </main>
        </body>
      </html>
    );
  }

  const isAdminPage = pathname.startsWith('/pages');

  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        {isAdminPage ? <AdminNavbar /> : <Navbar />}
        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
