import { ChartSplineIcon, LandmarkIcon } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';

interface AccountAvatarProps extends React.ComponentProps<typeof Avatar> {
  category: string;
}

interface AccountIconProps {
  category: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: LandmarkIcon,
  investment: ChartSplineIcon,
};

function AccountIcon({ category, className }: AccountIconProps) {
  const Icon = iconMap[category];

  return Icon ? (
    <Icon className={className} />
  ) : (
    <span className={cn('uppercase', className)}>{category.slice(0, 2)}</span>
  );
}

function AccountAvatar({ category, ...props }: AccountAvatarProps) {
  return (
    <Avatar {...props}>
      <AvatarFallback>
        <AccountIcon category={category} />
      </AvatarFallback>
    </Avatar>
  );
}

export { AccountIcon, AccountAvatar };
