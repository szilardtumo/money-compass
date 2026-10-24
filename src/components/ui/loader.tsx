import { cn } from 'cn';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

function Loader({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 className={cn('animate-spin opacity-70', className)} {...props} />;
}

export { Loader };
