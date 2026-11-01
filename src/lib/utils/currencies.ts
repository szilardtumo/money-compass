import { MissingExchangeRateError } from '@/lib/api/errors';
import { CurrencyMapper } from '@/lib/types/currencies.types';

/** Converts an amount to the main currency, or throws when its rate is missing */
export function toMainCurrency(
  { amount, currency }: { amount: number; currency: string },
  mapper: CurrencyMapper,
) {
  const rate = mapper[currency];
  if (!rate) {
    throw new MissingExchangeRateError(currency);
  }
  return amount * rate;
}
