import type { IntegrationAccount } from '@/lib/types/integrations.types';
import type { DbTx, schema } from '@/server/db';

import { enableBankingProvider } from './providers/enable-banking';
import { ibkrFlexProvider } from './providers/ibkr-flex';

export type IntegrationProvider = (typeof schema.integrations.provider.enumValues)[number];

export type LinkedIntegrationAccount = IntegrationAccount & {
  subaccountId: string;
  linkedAt: Date;
  integration: Pick<typeof schema.integrations.$inferSelect, 'credentials'>;
};

export interface ProviderEntry {
  label: string;
  dailySyncLimit: number;
  isRevokedError: (error: unknown) => boolean;
  /** Fetches from the provider, then returns the writes, which run inside the sync's transaction */
  sync: (account: LinkedIntegrationAccount) => Promise<
    (tx: DbTx) => Promise<{
      importedCount: number;
      correctionAmount: number | null;
      /** A warning about a sync that succeeded, which the sync log shows */
      error?: string | null;
    }>
  >;
}

export const integrationProviders = {
  enable_banking: enableBankingProvider,
  ibkr_flex: ibkrFlexProvider,
} satisfies Record<IntegrationProvider, ProviderEntry>;
