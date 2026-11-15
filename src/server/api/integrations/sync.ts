import 'server-only';

import { isPast, isToday } from 'date-fns';
import { eq } from 'drizzle-orm';

import { UserError } from '@/lib/api/errors';
import { Integration, IntegrationAccount } from '@/lib/types/integrations.types';
import { DbClient, DbTx, schema } from '@/server/db';

import { integrationProviders } from './providers';

export function getTodaySyncCount(account: IntegrationAccount) {
  return account.lastSyncedAt && isToday(account.lastSyncedAt) ? account.syncCount : 0;
}

/**
 * Syncs a linked account through its integration's provider. Every sync that passes the checks is
 * logged, failed ones too. A provider error that means the access ended revokes the integration.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 */
export async function syncAccount(
  account: IntegrationAccount & {
    integration: Pick<Integration, 'provider' | 'revokedAt' | 'expiresAt'>;
  },
  transaction: DbClient['rls'],
  trigger: 'manual' | 'cron',
) {
  const { subaccountId, linkedAt } = account;
  if (!subaccountId || !linkedAt) {
    throw new UserError('The bank account is not linked to a subaccount.');
  }
  if (account.integration.revokedAt || isPast(account.integration.expiresAt)) {
    throw new UserError('The access to the bank ended. Renew it to sync again.');
  }

  const provider = integrationProviders[account.integration.provider];
  const syncCount = getTodaySyncCount(account);
  if (syncCount >= provider.dailySyncLimit) {
    throw new UserError(
      `The bank account was already synced ${provider.dailySyncLimit} times today.`,
    );
  }

  const log = (tx: DbTx, values: Partial<typeof schema.integrationSyncLogs.$inferInsert>) =>
    tx
      .insert(schema.integrationSyncLogs)
      .values({ accountId: account.id, userId: account.userId, trigger, ...values });

  try {
    await transaction(async (tx) => {
      // Waits for a concurrent sync of the account, so the provider reads its writes
      await tx
        .select({ id: schema.integrationAccounts.id })
        .from(schema.integrationAccounts)
        .where(eq(schema.integrationAccounts.id, account.id))
        .for('update');

      const result = await provider.sync(tx, { ...account, subaccountId, linkedAt });

      await tx
        .update(schema.integrationAccounts)
        .set({ lastSyncedAt: new Date(), syncCount: syncCount + 1 })
        .where(eq(schema.integrationAccounts.id, account.id));
      await log(tx, result);
    });
  } catch (error) {
    const revoked = provider.isRevokedError(error);
    await transaction(async (tx) => {
      await log(tx, { error: error instanceof Error ? error.message : String(error) });
      if (revoked) {
        await tx
          .update(schema.integrations)
          .set({ revokedAt: new Date() })
          .where(eq(schema.integrations.id, account.integrationId));
      }
    });
    throw revoked ? new UserError('The access to the bank ended. Renew it to sync again.') : error;
  }
}
