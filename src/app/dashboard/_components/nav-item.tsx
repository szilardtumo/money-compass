import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface NavItemProps {
  href: string;
  isSelected?: boolean;
  children?: React.ReactNode;
}

export function NavItem({ href, isSelected = false, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: isSelected ? 'default' : 'ghost' }),
        'justify-start [&>*]:shrink-0',
      )}
    >
      {children}
    </Link>
  );
}
