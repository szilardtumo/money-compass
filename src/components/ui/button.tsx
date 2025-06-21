import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'font-normal p-0! relative after:absolute after:bg-primary after:bottom-2.5 after:h-px after:w-full after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:ease-in-out after:duration-300',
        linkUnderlined:
          'font-normal p-0! relative after:absolute after:bg-primary after:bottom-2.5 after:h-px after:w-full after:origin-bottom-left after:scale-x-100 hover:after:origin-bottom-right hover:after:scale-x-0 after:transition-transform after:ease-in-out after:duration-300',
        unstyled: '',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        card: 'w-32 p-4 flex-col justify-center gap-3 whitespace-normal text-balance rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const iconVariants = cva('shrink-0', {
  variants: {
    iconPlacement: { left: 'mr-2', right: 'ml-2' },
    size: {
      default: 'size-4',
      sm: 'size-3.5',
      lg: 'size-4',
      icon: 'size-4 ml-0 mr-0',
      card: 'size-4',
    },
    iconAnimation: {
      spin: 'animate-spin',
      expand:
        'w-0 opacity-0 m-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100',
      bounce: 'transition-transform',
    },
  },
  compoundVariants: [
    {
      iconPlacement: 'left',
      iconAnimation: 'expand',
      className: 'translate-x-0 group-hover:translate-x-100 group-hover:mr-2',
    },
    {
      iconPlacement: 'right',
      iconAnimation: 'expand',
      className: 'translate-x-100 group-hover:translate-x-0 group-hover:ml-2',
    },
    { iconAnimation: 'expand', size: 'sm', className: 'group-hover:w-3' },
    { iconPlacement: 'left', iconAnimation: 'bounce', className: 'group-hover:-translate-x-0.5' },
    { iconPlacement: 'right', iconAnimation: 'bounce', className: 'group-hover:translate-x-0.5' },
  ],
  defaultVariants: { iconPlacement: 'left', size: 'default' },
});

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants>,
    VariantProps<typeof iconVariants> {
  asChild?: boolean;
  icon?: React.ElementType;
  isLoading?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  iconPlacement = 'left',
  iconAnimation,
  isLoading = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button';
  const Icon = isLoading ? Loader2 : icon;

  return (
    <Comp
      className={cn(
        variant === 'unstyled' ? className : buttonVariants({ variant, size, className }),
      )}
      {...props}
    >
      {Icon && iconPlacement === 'left' && (
        <Icon
          className={cn(
            iconVariants({
              size,
              iconPlacement,
              iconAnimation: isLoading ? 'spin' : iconAnimation,
            }),
          )}
        />
      )}
      <SlotPrimitive.Slottable>{props.children}</SlotPrimitive.Slottable>
      {Icon && iconPlacement === 'right' && (
        <Icon
          className={cn(
            iconVariants({
              size,
              iconPlacement,
              iconAnimation: isLoading ? 'spin' : iconAnimation,
            }),
          )}
        />
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
