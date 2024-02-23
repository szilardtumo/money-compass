interface Subaccount {
  id: string;
  currency: string;
  value: number;
}

export interface Account {
  totalValue: number;
  id: string;
  name: string;
  subaccounts: Subaccount[];
}

export interface SimpleAccount {
  id: string;
  subaccountId: string;
  name: string;
  value: number;
  currency: string;
}
