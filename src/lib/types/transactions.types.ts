import { Account, Subaccount } from './accounts.types';
import { CurrencyValue } from './currencies.types';

export interface Transaction {
  id: string;
  accountId: string;
  subaccountId: string;
  type: string;
  amount: CurrencyValue;
  balance: CurrencyValue;
  originalCurrency: string;
  mainCurrency: string;
  startedDate: Date;
  description: string;
  createdAt: Date;
}

export interface TransactionWithAccount extends Transaction {
  subaccount: Subaccount;
  account: Account;
}

export interface TransactionHistory {
  date: Date;
  accountBalances: Record<
    string,
    {
      totalBalance: number;
      subaccountBalances: Record<string, CurrencyValue>;
    }
  >;
  mainCurrency: string;
}
