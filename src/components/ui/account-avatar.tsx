import { RiBankLine, RiLineChartLine } from '@remixicon/react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';

interface AccountAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  category: string;
}

interface AccountIconProps {
  category: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: RiBankLine,
  investment: RiLineChartLine,
};

function AccountIcon({ category, className }: AccountIconProps) {
  const Icon = iconMap[category];

  return Icon ? (
    <Icon className={className} />
  ) : (
    <span className={cn('uppercase', className)}>{category.slice(0, 2)}</span>
  );
}

const AccountAvatar = React.forwardRef<React.ElementRef<typeof Avatar>, AccountAvatarProps>(
  ({ category, ...props }, ref) => {
    return (
      <Avatar ref={ref} {...props}>
        <AvatarFallback>
          <AccountIcon category={category} />
        </AvatarFallback>
      </Avatar>
    );
  },
);
AccountAvatar.displayName = 'AccountAvatar';

export { AccountIcon, AccountAvatar };
