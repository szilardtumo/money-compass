import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Loader2 } from 'lucide-react';
import { Slot } from 'radix-ui';
import * as React from 'react';

// Based on shadcn/ui's button, without its `gap-2`: iconVariants spaces the `icon` prop so it can animate
const buttonVariants = cva(
  "group relative inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        linkUnderlined:
          'font-normal p-0! relative after:absolute after:bg-primary after:bottom-2.5 after:h-px after:w-full after:origin-bottom-left after:scale-x-100 hover:after:origin-bottom-right hover:after:scale-x-0 after:transition-transform after:ease-in-out after:duration-300',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        card: 'w-32 p-4 flex-col justify-center gap-3 whitespace-normal text-balance rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
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

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  icon,
  iconPlacement = 'left',
  iconAnimation,
  isLoading = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> &
  VariantProps<typeof iconVariants> & {
    asChild?: boolean;
    icon?: React.ElementType;
    isLoading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';
  const Icon = isLoading ? Loader2 : icon;
  const iconElement = Icon && (
    <Icon
      className={cn(
        iconVariants({ size, iconPlacement, iconAnimation: isLoading ? 'spin' : iconAnimation }),
      )}
    />
  );

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {iconPlacement === 'left' && iconElement}
      <Slot.Slottable>{children}</Slot.Slottable>
      {iconPlacement === 'right' && iconElement}
    </Comp>
  );
}

export { Button, buttonVariants };
