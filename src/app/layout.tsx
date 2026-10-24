import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { GlobalProviders } from '@/app/_components/global-providers';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Money Compass',
  description: 'Personal finance manager',
  icons: {
    icon: '/compass.svg',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <GlobalProviders>
          <Analytics />
          <SpeedInsights />
          <Toaster />
          {children}
        </GlobalProviders>
      </body>
    </html>
  );
}
