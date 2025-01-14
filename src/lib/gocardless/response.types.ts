export interface RequisitionResponse {
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

export type GetInstitutionsResponse = {
  id: string;
  name: string;
  bic?: string;
  transaction_total_days?: string;
  countries: string[];
  logo: string;
  max_access_valid_for_days?: string;
}[];

export interface GetRequisitionsResponse {
  results: RequisitionResponse[];
  count: number;
}

export interface GetAccountBalancesResponse {
  balances: { balanceAmount: { amount: string; currency: string } }[];
}

export interface GetAccountMetadataResponse {
  id: string;
  iban: string;
  status: string;
  owner_name: string;
  institution_id: string;
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
