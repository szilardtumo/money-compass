export interface GocardlessRequisition {
  id: string;
  created?: string;
  redirect: string;
  status: 'CR' | 'ID' | 'LN' | 'RJ' | 'ER' | 'SU' | 'EX' | 'GC' | 'UA' | 'GA' | 'SA';
  institution_id: string;
  agreement?: string;
  accounts: string[];
  link: string;
  ssn?: string;
  account_selection: boolean;
  redirect_immediate: boolean;
}

export interface GetAccountBalancesResponse {
  balances: { balanceAmount: { amount: string; currency: string } }[];
}

export interface GocardlessAccountDetails {
  resourceId: string;
  iban: string;
  status: string;
  currency: string;
  ownerName?: string;
  name?: string;
  displayName?: string;
}

export interface TransactionResponse {
  transactionId: string;
  bookingDateTime: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  debtorName?: string;
  creditorName?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
}

export interface GetAccountTransactionsResponse {
  transactions: {
    booked: TransactionResponse[];
    pending: TransactionResponse[];
  };
}

export interface GocardlessError {
  code: string;
  response: {
    data: {
      status_code: number;
      reference: {
        summary: string;
        detail: string;
      };
    };
  };
}
