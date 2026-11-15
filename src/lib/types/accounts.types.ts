import { CurrencyValue } from './currencies.types';

type AccountCategory = 'checking' | 'investment';

export interface Subaccount {
  id: string;
  name: string;
  originalCurrency: string;
  mainCurrency: string;
  /** In the original currency, without the holdings' market value */
  cash: number;
  /** The cash plus the holdings' market value */
  balance: CurrencyValue;
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  totalBalance: number;
  mainCurrency: string;
  category: AccountCategory;
  subaccounts: Subaccount[];
}
