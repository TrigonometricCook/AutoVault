import type { Metadata } from "next";
import "./globals.css";
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

export const metadata: Metadata = {
  title: "PartKeep",
  description: "A CAD version control and inventory manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        <main className="p-4">
        <ProtectedPageWrapper>
          {children}
        </ProtectedPageWrapper>
        </main>
      </body>
    </html>
  );
}


