import { CurrencyValue } from '@/lib/types/currencies.types';

type AccountCategory = 'checking' | 'investment';

interface Subaccount {
  id: string;
  currency: string;
  balance: number;
}

export interface Account {
  totalBalance: number;
  id: string;
  name: string;
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
