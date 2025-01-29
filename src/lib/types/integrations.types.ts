import { Subaccount } from '@/lib/types/accounts.types';

type IntegrationStatus = 'unconfirmed' | 'active' | 'expired' | 'unknown';

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  expiresAt?: Date;
  confirmationUrl: string;
  institution: {
    id: string;
    name: string;
    bic?: string;
    logoUrl?: string;
  };
  accounts: {
    id: string;
    iban: string;
    currency: string;
    ownerName?: string;
    name?: string;
  }[];
  links: {
    integrationAccountId: string;
    subaccount: Omit<Subaccount, 'mainCurrency' | 'balance'>;
  }[];
}

export interface GocardlessInstitution {
  id: string;
  name: string;
  bic?: string;
  transaction_total_days?: string;
  countries: string[];
  logo: string;
  max_access_valid_for_days?: string;
}
