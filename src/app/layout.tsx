import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { GlobalProgress } from '@/app/_components/global-progress';
import { GlobalProviders } from '@/app/_components/global-providers';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/cn';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Money Compass',
  description: 'Personal finance manager',
  icons: {
    icon: '/compass.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}>
        <GlobalProviders>
          <Analytics />
          <SpeedInsights />
          <GlobalProgress />
          <Toaster />
          {children}
        </GlobalProviders>
      </body>
    </html>
  );
}
