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
      <div className="flex flex-col w-full">
        <p className="text-sm font-medium text-destructive">An error occurred</p>
        <p className="text-xs text-destructive/80">{error.message}</p>
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer text-destructive/70">Error details</summary>
            <pre className="text-xs mt-1 p-2 bg-destructive/5 rounded overflow-x-scroll">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
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
