'use client';

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';

type ActionFn = () => void;

interface LoadingContextType {
  isLoading: boolean;
  startTransition: (action: ActionFn) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

interface LoadingProviderProps {
  children?: React.ReactNode;
}

export function useLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  return context;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isPending, startTransition] = useTransition();

  const start = useCallback((action: ActionFn) => {
    startTransition(() => {
      action();
    });
  }, []);

  const value = useMemo(
    () => ({ isLoading: isPending, startTransition: start }),
    [isPending, start],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}
