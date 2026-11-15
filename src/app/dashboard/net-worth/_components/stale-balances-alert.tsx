import { differenceInDays } from 'date-fns';
import { TriangleAlertIcon } from 'lucide-react';
import { connection } from 'next/server';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isPriceStale } from '@/server/api/investments/overview';
import { apiQueries } from '@/server/api/queries';

/**
 * Lists the subaccounts with a balance that hasn't synced or changed for a month, and the held
 * securities without a recent price, which make the net worth out of date.
 */
export async function StaleBalancesAlert() {
  const [accounts, balances, integrations, holdings] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.accounts.getSubaccountBalances(),
    apiQueries.integrations.getIntegrations(),
    apiQueries.investments.getHoldings(),
  ]);
  await connection();
  const now = new Date();
  const syncedAt = new Map(
    integrations.flatMap((integration) =>
      integration.accounts.map((account) => [account.subaccountId, account.lastSyncedAt]),
    ),
  );

  const stale = accounts.flatMap((account) =>
    account.subaccounts.flatMap((subaccount) => {
      const dates = [balances[subaccount.id]?.lastTransactionDate, syncedAt.get(subaccount.id)];
      const updatedAt = Math.max(...dates.map((date) => (date ? new Date(date).getTime() : 0)));
      const days = differenceInDays(now, updatedAt);
      return subaccount.balance.originalValue && days > 30
        ? [{ id: subaccount.id, name: `${account.name} (${subaccount.name})`, days }]
        : [];
    }),
  );
  // A security held in two subaccounts is listed once
  const stalePrices = [
    ...new Map(holdings.map((holding) => [holding.securityId, holding])).values(),
  ].filter((holding) => isPriceStale(holding.lastPriceDate, now));
  if (!stale.length && !stalePrices.length) {
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
          {stalePrices.map((holding) => (
            <li key={holding.securityId}>
              {holding.name} ({holding.symbol}),{' '}
              {holding.lastPriceDate
                ? `last priced ${differenceInDays(now, holding.lastPriceDate)} days ago`
                : 'no price in the last 30 days'}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
