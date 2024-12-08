'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';

import { Separator } from './separator';

const SeparatorWithText = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ children, className, ...props }, ref) => (
    <div className="relative" ref={ref} {...props}>
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{children}</span>
      </div>
    </div>
  ),
);
SeparatorWithText.displayName = SeparatorPrimitive.Root.displayName;

export { SeparatorWithText };
