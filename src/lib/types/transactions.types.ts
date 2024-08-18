import { Account } from '@/lib/types/accounts.types';
import { CurrencyValue } from '@/lib/types/currencies.types';

export interface Transaction {
  id: string;
  accountId: string;
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
  account: Account;
}

export interface TransactionHistory {
  date: string;
  accountBalances: Record<
    string,
    {
      totalBalance: number;
      subaccountBalances: Record<string, CurrencyValue>;
    }
  >;
  mainCurrency: string;
}
