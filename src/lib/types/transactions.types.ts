import { Account, Subaccount } from '@/lib/types/accounts.types';
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
  description: string;
  createdAt: Date;
}

export interface TransactionWithAccount extends Transaction {
  subaccount: Subaccount;
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
