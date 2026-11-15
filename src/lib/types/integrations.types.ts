import type { InferSelectModel } from 'drizzle-orm';

import type { schema } from '@/server/db';

export interface Institution {
  name: string;
  country: string;
  logoUrl: string;
  maxConsentSeconds: number;
}

export type IntegrationAccount = InferSelectModel<typeof schema.integrationAccounts>;

export type IntegrationSyncLog = InferSelectModel<typeof schema.integrationSyncLogs>;

export type Integration = Omit<InferSelectModel<typeof schema.integrations>, 'credentials'> & {
  status: 'active' | 'expiring' | 'expired' | 'revoked';
  accounts: (IntegrationAccount & { syncsToday: number; syncLogs: IntegrationSyncLog[] })[];
};
