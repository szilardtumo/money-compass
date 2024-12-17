import NumberFlow, { Format } from '@number-flow/react';
import React from 'react';

interface CurrencyProps extends Omit<React.ComponentPropsWithRef<typeof NumberFlow>, 'format'> {
  currency: string;
  formatOptions?: Format;
}

const Currency = ({ value, currency, formatOptions = {}, ...props }: CurrencyProps) => (
  <NumberFlow value={value} format={{ style: 'currency', currency, ...formatOptions }} {...props} />
);

export { Currency };
