import { CalendarIcon } from '@radix-ui/react-icons';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/utils/formatters';

export interface DatePickerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: Date | undefined;
  onValueChange?: (value: Date | undefined) => void;
  disabled?: boolean | ((date: Date) => boolean);
  placeholder?: string;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    { className, value, onValueChange, disabled = false, placeholder = 'Pick a date', ...props },
    ref,
  ) => {
    const disabledFn = typeof disabled === 'function' ? disabled : () => disabled;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'flex w-full pl-3 text-left font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
            ref={ref}
            {...props}
          >
            {value ? formatDate(value) : <span>{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onValueChange}
            disabled={(date) => disabledFn(date) || date < new Date('1900-01-01')}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
