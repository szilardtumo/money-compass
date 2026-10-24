'use client';

import { PageErrorFallback } from '@/components/ui/error-boundary';

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PageErrorFallback error={error} resetErrorBoundary={retry} />;
}
