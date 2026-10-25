import type { InferSelectModel } from 'drizzle-orm';

import type { schema } from '@/server/db';

export interface Institution {
  name: string;
  country: string;
  logoUrl: string;
  maxConsentSeconds: number;
}

export interface BankSession {
  id: string;
  expiresAt: Date;
  institution: { name: string; country: string };
  accounts: BankAccount[];
}

export interface BankAccount {
  externalId: string;
  identificationHash: string;
  name: string;
  iban: string | null;
  currency: string;
}

export interface BankTransaction {
  externalRef: string | null;
  amount: number;
  date: Date;
  description: string;
  counterpartyName: string;
}

export type IntegrationStatus = 'active' | 'expiring' | 'expired' | 'revoked';

export type IntegrationAccount = InferSelectModel<typeof schema.integrationAccounts>;

export type Integration = InferSelectModel<typeof schema.integrations> & {
  status: IntegrationStatus;
  accounts: (IntegrationAccount & { syncsToday: number })[];
};
