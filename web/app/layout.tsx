import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import QueryProvider from '../components/QueryProvider';
import { SessionProvider } from 'next-auth/react';
import AuthButton from '../components/AuthButton';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + ' min-h-screen flex flex-col'}>
        <SessionProvider>
          <QueryProvider>
            <nav className="p-4 border-b flex justify-end">
              <AuthButton />
            </nav>
            <main className="flex-1">{children}</main>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
