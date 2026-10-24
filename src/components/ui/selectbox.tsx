import { cn } from 'cn';
import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectboxProps extends Omit<React.ComponentProps<typeof SelectTrigger>, 'value'> {
  options: readonly { label: string; value: string }[];
  value: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
}

function Selectbox({
  className,
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  ...props
}: SelectboxProps) {
  return (
    <Select onValueChange={onValueChange} defaultValue={value}>
      <SelectTrigger className={cn('w-full', className)} {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { Selectbox };
