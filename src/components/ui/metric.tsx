import { cn } from 'cn';
import * as React from 'react';

function Metric({ className, ...props }: React.ComponentProps<'h3'>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h3 className={cn('font-bold text-2xl', className)} {...props} />;
}

export { Metric };
