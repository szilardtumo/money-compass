export interface Transaction {
  id: string;
  subaccountId: string;
  type: string;
  amount: number;
  balance: number;
  startedDate: string;
}
