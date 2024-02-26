interface Subaccount {
  id: string;
  currency: string;
  balance: number;
}

export interface Account {
  totalBalance: number;
  id: string;
  name: string;
  subaccounts: Subaccount[];
}

export interface SimpleAccount {
  id: string;
  subaccountId: string;
  name: string;
  balance: number;
  currency: string;
}
