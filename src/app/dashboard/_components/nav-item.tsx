import { buttonVariants } from '@/components/ui/button';
import { NavLink } from '@/components/ui/nav-link';
import { cn } from '@/lib/cn';

interface NavItemProps {
  href: string;
  isSelected?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function NavItem({ href, icon: Icon, isSelected = false, children }: NavItemProps) {
  return (
    <NavLink
      href={href}
      className={cn(
        buttonVariants({ variant: isSelected ? 'default' : 'ghost' }),
        'justify-start [&>svg]:shrink-0',
      )}
    >
      {Icon}
      <span className="overflow-hidden text-ellipsis">{children}</span>
    </NavLink>
  );
}
