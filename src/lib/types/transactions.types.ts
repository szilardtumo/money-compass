import { SimpleAccount } from '@/lib/types/accounts.types';

export interface Transaction {
  id: string;
  subaccountId: string;
  type: string;
  amount: number;
  balance: number;
  startedDate: string;
  order: number;
  description: string;
}

export interface TransactionWithAccount extends Transaction {
  account: SimpleAccount;
}

export interface TransactionHistory {
  date: string;
  accountBalances: Record<
    string,
    {
      originalCurrency: number;
      mainCurrency: number;
    }
  >;
  mainCurrency: string;
}
