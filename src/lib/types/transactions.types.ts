import { Account, Subaccount } from './accounts.types';
import { Category } from './categories.types';
import { CurrencyValue } from './currencies.types';

export const TRANSACTION_TYPE_OPTIONS = [
  { label: 'Card payment', value: 'card_payment' },
  { label: 'Refund', value: 'refund' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Exchange', value: 'exchange' },
  { label: 'Top-up', value: 'topup' },
  { label: 'ATM', value: 'atm' },
  { label: 'Fee', value: 'fee' },
  { label: 'Reward', value: 'reward' },
  { label: 'Correction', value: 'correction' },
  { label: 'Other', value: 'other' },
];

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
  merchant: { id: string; name: string; transactionCount: number } | null;
  /** The transaction's own category, else its merchant's */
  category: Category | null;
  categorySource: 'transaction' | 'merchant' | null;
  /** Excluded from analytics by its category, or as an exchange, top-up or correction */
  excluded: boolean;
}

export interface TransactionWithAccount extends Transaction {
  subaccount: Subaccount;
  account: Account;
}

export interface TransactionHistory {
  /** The start of the month, with the balances at its end */
  date: Date;
  /** Of all accounts in the main currency */
  totalBalance: number;
  accountBalances: Record<
    string,
    {
      totalBalance: number;
      subaccountBalances: Record<string, CurrencyValue>;
    }
  >;
  mainCurrency: string;
}
