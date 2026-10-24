import { cn } from 'cn';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ComboboxProps extends Omit<React.ComponentProps<'button'>, 'value'> {
  options: readonly { label: string; value: string }[];
  value: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  notFoundMessage?: string;
}

function Combobox({
  className,
  options,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select...',
  notFoundMessage = 'Not Found.',
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex w-full justify-between focus:outline-hidden focus:ring-1 focus:ring-ring',
            className,
          )}
          {...props}
        >
          {options.find((option) => option.value === value)?.label ?? placeholder}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? undefined : currentValue);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {value === option.value && <CheckIcon className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
