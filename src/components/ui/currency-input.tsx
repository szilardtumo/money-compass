import * as React from 'react';
import { NumericFormat } from 'react-number-format';

import { Input } from '@/components/ui/input';
import { getCurrencySymbol } from '@/lib/utils/formatters';

type CurrencyInputProps = React.ComponentProps<typeof Input> & {
  currency?: string;
  value: number;
  onChange: (value: number | undefined) => void;
  type?: never;
  defaultValue?: never;
};

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency, onChange, ...props }, ref) => {
    const currencyPrefix = React.useMemo(
      () => (currency ? `${getCurrencySymbol(currency)} ` : ''),
      [currency],
    );

    return (
      <NumericFormat
        {...props}
        onValueChange={({ floatValue }) => onChange(floatValue)}
        customInput={Input}
        getInputRef={ref}
        prefix={currencyPrefix}
        decimalScale={2}
        thousandsGroupStyle="thousand"
        thousandSeparator=","
        allowLeadingZeros={false}
        allowNegative
        isAllowed={({ floatValue }) => floatValue === undefined || floatValue < 1_000_000_000_000}
      />
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
