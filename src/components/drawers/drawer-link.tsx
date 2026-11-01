'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ComponentProps } from 'react';

/** A category ID or "uncategorized", a merchant ID or an account ID, and the period it shows */
type DrawerTarget = ({ category: string } | { merchant: string } | { account: string }) & {
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
    for (const [key, value] of Object.entries(target ?? {})) {
      params.set(key, value);
    }
    return params.size ? `${pathname}?${params}` : pathname;
  };
}

export function DrawerLink({
  to,
  ...props
}: { to: DrawerTarget } & Omit<ComponentProps<typeof Link>, 'href'>) {
  const getHref = useDrawerHref();
  // Lists have hundreds of these
  return <Link href={getHref(to)} scroll={false} prefetch={false} {...props} />;
}
