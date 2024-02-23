import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectboxProps extends React.HTMLAttributes<HTMLButtonElement> {
  options: readonly { label: string; value: string }[];
  value: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
}

const Selectbox = React.forwardRef<HTMLButtonElement, SelectboxProps>(
  ({ className, options, value, onValueChange, placeholder = 'Select...', ...props }, ref) => {
    return (
      <Select onValueChange={onValueChange} defaultValue={value}>
        <SelectTrigger ref={ref} {...props}>
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
  },
);
Selectbox.displayName = 'Selectbox';

export { Selectbox };
