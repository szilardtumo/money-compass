import { CurrencyValue } from '@/lib/types/currencies.types';

type AccountCategory = 'checking' | 'investment';

export interface Subaccount {
  id: string;
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

export interface SimpleAccount {
  id: string;
  subaccountId: string;
  name: string;
  balance: CurrencyValue;
  originalCurrency: string;
  mainCurrency: string;
  category: AccountCategory;
}
