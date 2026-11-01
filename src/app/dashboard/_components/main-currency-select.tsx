'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOptimisticActionWithToast } from '@/hooks/useActionWithToast';
import { Currency } from '@/lib/types/currencies.types';
import { apiActions } from '@/server/api/actions';

interface MainCurrencySelectProps {
  mainCurrency: string;
  currencies: Currency[];
}

export function MainCurrencySelect({ mainCurrency, currencies }: MainCurrencySelectProps) {
  const { execute, optimisticState } = useOptimisticActionWithToast(
    apiActions.profiles.updateProfile,
    {
      currentState: mainCurrency,
      updateFn: (_, input) => input.mainCurrency,
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to change main currency',
        description: errorMessage,
      }),
    },
  );

  return (
    <Select
      value={optimisticState}
      onValueChange={(value) => value !== mainCurrency && execute({ mainCurrency: value })}
    >
      <SelectTrigger id="main-currency" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.id} value={currency.id}>
            {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
