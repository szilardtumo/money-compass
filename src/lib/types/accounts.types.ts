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
  name: string;
  value: number;
  currency: string;
}

export interface CreateSimpleAccountParams {
  name: string;
  currency: string;
}
