import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { AccountsCard } from '@/components/cards/accounts-card';
import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { Separator } from '@/components/ui/separator';
import { mainCurrency } from '@/lib/constants';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactionHistory } from '@/lib/db/transactions.queries';

export default async function TestPage() {
  const [accounts, transactionHistory, currencyMapper] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
    getCurrencyMapper(mainCurrency),
  ]);

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">Test page</h1>
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <NetWorthHistoryCard data={transactionHistory} accounts={accounts} />

        <AccountHistoryCard data={transactionHistory} account={accounts[0]} />

        <AssetDistributionCard accounts={accounts} currencyMapper={currencyMapper} />

        <QuickActionsCard />

        <AccountsCard accounts={accounts} />

        <RecentTransactionsCard />
      </div>
    </main>
  );
}
