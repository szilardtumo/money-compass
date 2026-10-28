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
  counterpartyName: string;
  dataSource: 'integration' | 'manual';
  createdAt: Date;
  /** The other leg of an exchange, in its own currency */
  linkedTransaction: { amount: number; currency: string } | null;
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
