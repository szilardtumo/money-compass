import React from 'react';

import { cn } from '@/lib/cn';

const Metric = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h3 ref={ref} className={cn('font-bold text-2xl', className)} {...props} />
  ),
);
Metric.displayName = 'Metric';

export { Metric };
