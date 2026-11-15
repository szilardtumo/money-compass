import { apiQueries } from '@/server/api/queries';

import { HoldingDrawerClient } from './holding-drawer-client';

/**
 * The drawer of a security in the broker accounts, with its price and trades, its gains and its
 * transactions. It works for sold securities too.
 */
export async function HoldingDrawer({ securityId }: { securityId: string }) {
  const [holding, accounts, categories, { mainCurrency }] = await Promise.all([
    apiQueries.investments.getHoldingDetail(securityId),
    apiQueries.accounts.getAccounts(),
    apiQueries.categories.getCategories(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);
  // A security the broker accounts never traded closes the drawer
  if (!holding) {
    return null;
  }

  const { data: transactions } = await apiQueries.transactions.getTransactions({
    subaccountIds: holding.subaccountIds,
    pageSize: 10_000,
  });
  const transactionIds = new Set(holding.transactionIds);

  return (
    <HoldingDrawerClient
      holding={holding}
      transactions={transactions.filter((transaction) => transactionIds.has(transaction.id))}
      accounts={accounts}
      categories={categories}
      mainCurrency={mainCurrency}
    />
  );
}
