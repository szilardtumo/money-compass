'use client';

import './globals.css';

import { PageErrorFallback } from '@/components/ui/error-boundary';

// Replaces the root layout when it fails, so it renders its own document and styles
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <title>Money Compass</title>
        <PageErrorFallback error={error} resetErrorBoundary={retry} />
      </body>
    </html>
  );
}
