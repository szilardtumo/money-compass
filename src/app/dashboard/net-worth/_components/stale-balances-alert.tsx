import { differenceInDays } from 'date-fns';
import { TriangleAlertIcon } from 'lucide-react';
import { connection } from 'next/server';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiQueries } from '@/server/api/queries';

/**
 * Lists the subaccounts with a balance that hasn't synced or changed for a month, which makes the
 * net worth out of date.
 */
export async function StaleBalancesAlert() {
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

  const stale = accounts.flatMap((account) =>
    account.subaccounts.flatMap((subaccount) => {
      const dates = [balances[subaccount.id]?.lastTransactionDate, syncedAt.get(subaccount.id)];
      const updatedAt = Math.max(...dates.map((date) => (date ? new Date(date).getTime() : 0)));
      const days = differenceInDays(new Date(), updatedAt);
      return subaccount.balance.originalValue && days > 30
        ? [{ id: subaccount.id, name: `${account.name} (${subaccount.name})`, days }]
        : [];
    }),
  );
  if (!stale.length) {
    return null;
  }

  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>Some balances may be out of date</AlertTitle>
      <AlertDescription>
        <ul className="list-inside list-disc">
          {stale.map((item) => (
            <li key={item.id}>
              {item.name}, last updated {item.days} days ago
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
