import { SimpleAccount } from '@/lib/types/accounts.types';
import { CurrencyValue } from '@/lib/types/currencies.types';

export interface Transaction {
  id: string;
  subaccountId: string;
  type: string;
  amount: CurrencyValue;
  balance: CurrencyValue;
  originalCurrency: string;
  mainCurrency: string;
  startedDate: string;
  order: number;
  description: string;
}

export interface TransactionWithAccount extends Transaction {
  account: SimpleAccount;
}

export interface TransactionHistory {
  date: string;
  accountBalances: Record<string, CurrencyValue>;
  mainCurrency: string;
}
