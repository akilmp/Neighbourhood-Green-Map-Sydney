import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import QueryProvider from '../components/QueryProvider';
import { SessionProvider } from 'next-auth/react';
import AuthButton from '../components/AuthButton';
import '../lib/sentry';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang="en">
      <body className={inter.className + ' min-h-screen flex flex-col'}>
        {plausibleDomain && (
          <Script
            src={`https://${plausibleDomain}/js/script.js`}
            data-domain={plausibleDomain}
            strategy="afterInteractive"
          />
        )}
        <SessionProvider>
          <QueryProvider>
            <nav className="p-4 border-b flex justify-between items-center">
              <div className="space-x-4">
                <Link href="/">Home</Link>
                <Link href="/routes">Routes</Link>
                <Link href="/routes/new">New Route</Link>
              </div>
              <AuthButton />
            </nav>
            <main className="flex-1">{children}</main>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
