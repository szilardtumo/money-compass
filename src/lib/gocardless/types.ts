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

export interface GocardlessAmount {
  amount: string;
  currency: string;
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

export interface GocardlessTransaction {
  transactionId: string;
  transactionAmount: GocardlessAmount;
  bookingDate?: string;
  bookingDateTime?: string;
  valueDate?: string;
  valueDateTime?: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  remittanceInformationStructured?: string;
  remittanceInformationStructuredArray?: string[];
  additionalInformation?: string;
  bankTransactionCode?: string;
  proprietaryBankTransactionCode?: string;
}

export interface GocardlessError {
  code: string;
  response: {
    data: {
      status_code: number;
      summary?: string;
      detail?: string;
      reference?: {
        summary: string;
        detail: string;
      };
    };
  };
}
