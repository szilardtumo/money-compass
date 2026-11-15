'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';

interface NavItemProps {
  href: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function NavItem({ href, icon: Icon, children }: NavItemProps) {
  const isSelected = usePathname() === href;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: isSelected ? 'default' : 'ghost' }),
        'justify-start [&>svg]:shrink-0',
      )}
    >
      {Icon}
      <span className="overflow-hidden text-ellipsis">{children}</span>
    </Link>
  );
}
