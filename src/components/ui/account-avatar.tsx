import { RiBankLine, RiLineChartLine } from '@remixicon/react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AccountAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  category: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: RiBankLine,
  investment: RiLineChartLine,
};

const AccountAvatar = React.forwardRef<React.ElementRef<typeof Avatar>, AccountAvatarProps>(
  ({ category, ...props }, ref) => {
    const Icon = iconMap[category];

    return (
      <Avatar ref={ref} {...props}>
        <AvatarFallback>
          {Icon ? (
            <Icon className="w-1/2 h-1/2" />
          ) : (
            <span className="uppercase">{category.slice(0, 2)}</span>
          )}
        </AvatarFallback>
      </Avatar>
    );
  },
);
AccountAvatar.displayName = 'AccountAvatar';

export { AccountAvatar };
