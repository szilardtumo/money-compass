import { QuickActionsSection } from '@/app/dashboard/accounts/_components/quick-actions-section';
import { TransactionsSection } from '@/app/dashboard/accounts/_components/transactions-section';
import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthCard } from '@/components/cards/net-worth-card';
import { Separator } from '@/components/ui/separator';
import { mainCurrency } from '@/lib/constants';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactionHistory } from '@/lib/db/transactions.queries';

import { AccountsSection } from './_components/accounts-section';

export default async function AccountsPage() {
  const [accounts, transactionHistory, currencyMapper] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
    getCurrencyMapper(mainCurrency),
  ]);

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">Accounts</h1>
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <NetWorthCard data={transactionHistory} />

        <AssetDistributionCard accounts={accounts} currencyMapper={currencyMapper} />

        <QuickActionsSection />

        <AccountsSection accounts={accounts} />

        <TransactionsSection />
      </div>
    </main>
  );
}
