import { QuickActionsSection } from '@/app/dashboard/accounts/_components/quick-actions-section';
import { TransactionsSection } from '@/app/dashboard/accounts/_components/transactions-section';
import { NetWorthChart } from '@/components/charts/net-worth-chart';
import { Separator } from '@/components/ui/separator';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getTransactionHistory } from '@/lib/db/transactions.queries';

import { AccountsSection } from './_components/accounts-section';

export default async function AccountsPage() {
  const [accounts, transactionHistory] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
  ]);

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">Accounts</h1>
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <NetWorthChart data={transactionHistory} />

        <QuickActionsSection />

        <AccountsSection accounts={accounts} />

        <TransactionsSection />
      </div>
    </main>
  );
}
