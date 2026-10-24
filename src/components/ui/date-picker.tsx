import { cn } from 'cn';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/utils/formatters';

interface DatePickerProps extends Omit<React.ComponentProps<'button'>, 'value' | 'disabled'> {
  value: Date | undefined;
  onValueChange?: (value: Date | undefined) => void;
  disabled?: boolean | ((date: Date) => boolean);
  placeholder?: string;
}

function DatePicker({
  className,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Pick a date',
  ...props
}: DatePickerProps) {
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
          {...props}
        >
          {value ? formatDate(value) : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto size-4 opacity-50" />
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
}

export { DatePicker };
