'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { ComponentProps } from 'react';

import { ProgressLink } from '@/components/navigation-progress';

/**
 * A category ID or "uncategorized", a merchant ID or an account ID, and the period it shows. A
 * merchant's drawer can list its transactions of all time.
 */
type DrawerTarget = (
  { category: string } | { merchant: string; history?: 'all' } | { account: string }
) & {
  period?: string;
};

/**
 * Returns the URL of the current page with the drawer of a category, merchant or account open, or with no
 * drawer for null. The page keeps its own params, like the analytics period.
 */
export function useDrawerHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (target: DrawerTarget | null) => {
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    params.delete('merchant');
    params.delete('account');
    params.delete('history');
    for (const [key, value] of Object.entries(target ?? {})) {
      params.set(key, value);
    }
    return params.size ? `${pathname}?${params}` : pathname;
  };
}

export function DrawerLink({
  to,
  ...props
}: { to: DrawerTarget } & Omit<ComponentProps<typeof ProgressLink>, 'href'>) {
  const getHref = useDrawerHref();
  // Lists have hundreds of these
  return <ProgressLink href={getHref(to)} prefetch={false} {...props} />;
}
