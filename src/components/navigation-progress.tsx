'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, createContext, ReactNode, useContext, useTransition } from 'react';

const NavigateContext = createContext<((href: string) => void) | null>(null);

/**
 * Shows a bar at the top while a navigation of useNavigate or ProgressLink waits for the server,
 * like opening a drawer or changing the period, which keep the old page until the new one arrives.
 */
export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <NavigateContext value={(href) => startTransition(() => router.push(href, { scroll: false }))}>
      {pending && <div className="fixed inset-x-0 top-0 z-100 h-0.5 animate-pulse bg-primary" />}
      {children}
    </NavigateContext>
  );
}

/** Navigates without scrolling, with the progress bar */
export function useNavigate() {
  const navigate = useContext(NavigateContext);
  if (!navigate) {
    throw new Error('useNavigate must be used within a NavigationProgressProvider');
  }
  return navigate;
}

/** A link that shows the progress bar and keeps the scroll position */
export function ProgressLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const navigate = useNavigate();

  return (
    <Link
      href={href}
      scroll={false}
      onNavigate={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    />
  );
}
