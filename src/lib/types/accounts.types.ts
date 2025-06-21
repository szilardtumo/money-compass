import { CurrencyValue } from './currencies.types';

type AccountCategory = 'checking' | 'investment';

export interface Subaccount {
  id: string;
  name: string;
  originalCurrency: string;
  mainCurrency: string;
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
