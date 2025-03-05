'use client';

import { AlertCircle } from 'lucide-react';
import {
  ErrorBoundary as ReactErrorBoundary,
  ErrorBoundaryProps as ReactErrorBoundaryProps,
} from 'react-error-boundary';

import { Button } from '@/components/ui/button';

const FallbackComponent = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">An error occurred: {error.message}</p>
    </div>
    <Button variant="outline" size="sm" className="mt-2" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </div>
);

type ErrorBoundaryProps = Omit<ReactErrorBoundaryProps, 'fallback' | 'fallbackRender'>;

export function ErrorBoundary({ children, ...rest }: Partial<ErrorBoundaryProps>) {
  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent} {...rest}>
      {children}
    </ReactErrorBoundary>
  );
}
