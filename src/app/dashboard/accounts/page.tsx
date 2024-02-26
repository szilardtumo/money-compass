import { NetWorthChart } from '@/components/charts/net-worth-chart';
import { Separator } from '@/components/ui/separator';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';

import { AccountsSection } from './_components/accounts-section';

export default async function AccountsPage() {
  const accounts = await getSimpleAccounts();

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">Accounts</h1>
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <NetWorthChart netWorth={1234} />

        <AccountsSection accounts={accounts} />
      </div>
    </main>
  );
}
