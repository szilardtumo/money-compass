'use client';

import { PageErrorFallback } from '@/components/ui/error-boundary';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageErrorFallback error={error} resetErrorBoundary={reset} />;
}
