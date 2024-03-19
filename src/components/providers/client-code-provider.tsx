'use client';

import * as React from 'react';

interface ClientCodeProviderProps {
  children: React.ReactNode;
}

const disableDefaultPropsError = () => {
  const { error } = console;
  // eslint-disable-next-line no-console
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };
};

export function ClientCodeProvider({ children }: ClientCodeProviderProps) {
  React.useEffect(() => {
    disableDefaultPropsError();
  }, []);

  return children;
}
