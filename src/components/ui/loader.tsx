import { cn } from 'cn';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

const Loader = React.forwardRef<
  React.ElementRef<typeof Loader2>,
  React.ComponentPropsWithoutRef<typeof Loader2>
>(({ className, ...props }, ref) => (
  <Loader2 ref={ref} className={cn('animate-spin opacity-70', className)} {...props} />
));
Loader.displayName = 'Loader';

export { Loader };
