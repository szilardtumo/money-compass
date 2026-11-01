import 'server-only';

import { differenceInDays } from 'date-fns';
import { connection } from 'next/server';

import { apiQueries } from '@/server/api/queries';

const STALE_DAYS = 30;

/**
 * Returns the subaccounts with a balance that hasn't synced or changed for a month, which makes the
 * net worth out of date, with the days since.
 */
export async function getStaleSubaccounts() {
  const [accounts, balances, integrations] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.accounts.getSubaccountBalances(),
    apiQueries.integrations.getIntegrations(),
  ]);
  await connection();
  const syncedAt = new Map(
    integrations.flatMap((integration) =>
      integration.accounts.map((account) => [account.subaccountId, account.lastSyncedAt]),
    ),
  );

  return accounts.flatMap((account) =>
    account.subaccounts.flatMap((subaccount) => {
      const dates = [balances[subaccount.id]?.lastTransactionDate, syncedAt.get(subaccount.id)];
      const updatedAt = Math.max(...dates.map((date) => (date ? new Date(date).getTime() : 0)));
      const days = differenceInDays(new Date(), updatedAt);
      return subaccount.balance.originalValue && days > STALE_DAYS
        ? [{ ...subaccount, name: `${account.name} (${subaccount.name})`, days }]
        : [];
    }),
  );
}
