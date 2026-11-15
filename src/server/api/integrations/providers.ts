import type { IntegrationAccount } from '@/lib/types/integrations.types';
import type { DbTx, schema } from '@/server/db';

import { enableBankingProvider } from './providers/enable-banking';

export type IntegrationProvider = (typeof schema.integrations.provider.enumValues)[number];

export type LinkedIntegrationAccount = IntegrationAccount & {
  subaccountId: string;
  linkedAt: Date;
};

export interface ProviderEntry {
  label: string;
  dailySyncLimit: number;
  isRevokedError: (error: unknown) => boolean;
  sync: (
    tx: DbTx,
    account: LinkedIntegrationAccount,
  ) => Promise<{ importedCount: number; correctionAmount: number | null }>;
}

export const integrationProviders = {
  enable_banking: enableBankingProvider,
} satisfies Record<IntegrationProvider, ProviderEntry>;
