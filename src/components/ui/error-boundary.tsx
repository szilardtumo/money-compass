'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  ErrorBoundary as ReactErrorBoundary,
  ErrorBoundaryProps as ReactErrorBoundaryProps,
} from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DevErrorStack = ({ error }: { error: Error }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <details className="text-left w-full max-w-md my-4">
      <summary className="text-xs cursor-pointer">Error details</summary>
      <pre className="text-xs mt-1 p-2 bg-destructive/5 rounded overflow-x-scroll">
        {error.stack}
      </pre>
    </details>
  );
};

export const ComponentErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 flex flex-col items-center text-center">
      <AlertCircle className="size-5 text-destructive my-2" />
      <h3 className="text-sm font-medium mb-1">Something went wrong!</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <DevErrorStack error={error} />
      <Button
        icon={RefreshCw}
        variant="outline"
        size="sm"
        onClick={resetErrorBoundary}
        className="mt-3"
      >
        Try again
      </Button>
    </CardContent>
  </Card>
);

export const PageErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-background">
    <div className="rounded-full bg-destructive/15 p-4 mb-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
    </div>
    <h2 className="text-2xl font-bold mb-2 text-foreground">Something went wrong!</h2>
    <p className="text-muted-foreground max-w-md">
      We encountered an error while processing your request. Please try again or contact support if
      the issue persists.
    </p>
    <DevErrorStack error={error} />
    <Button icon={RefreshCw} onClick={resetErrorBoundary} className="mt-6">
      Try again
    </Button>
  </div>
);

type ErrorBoundaryProps = ReactErrorBoundaryProps;

export function ErrorBoundary({ children, ...rest }: Partial<ErrorBoundaryProps>) {
  return <ReactErrorBoundary {...rest}>{children}</ReactErrorBoundary>;
}
