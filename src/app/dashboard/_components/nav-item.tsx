import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface NavItemProps {
  href: string;
  isSelected?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function NavItem({ href, icon: Icon, isSelected = false, children }: NavItemProps) {
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
