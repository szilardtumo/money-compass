import * as React from 'react';

import { Separator } from './separator';

function SeparatorWithText({ children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className="relative" {...props}>
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{children}</span>
      </div>
    </div>
  );
}

export { SeparatorWithText };
