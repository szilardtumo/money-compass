'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import { useLoading } from '@/components/providers/loading-provider';

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  href: string;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, onClick, ...props }, ref) => {
    const router = useRouter();
    const { startTransition } = useLoading();

    return (
      <Link
        ref={ref}
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
          startTransition(() => router.push(href));
        }}
        {...props}
      />
    );
  },
);
NavLink.displayName = 'NavLink';
