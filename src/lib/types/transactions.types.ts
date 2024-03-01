export interface Transaction {
  id: string;
  subaccountId: string;
  type: string;
  amount: number;
  balance: number;
  startedDate: string;
  description: string;
}

export interface TransactionHistory {
  date: string;
  balances: Record<string, number>;
}
