import { Separator } from '@/components/ui/separator';
import { mainCurrency } from '@/lib/constants';
import { getAccounts } from '@/lib/db/accounts';

import { AccountCard } from './_components/AccountCard';
import { NoAccountsPlaceholder } from './_components/NoAccountsPlaceholder';

export default async function AccountsPage() {
  const accounts = await getAccounts(mainCurrency);

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">Accounts</h1>
      </div>
      <Separator />
      <div className="m-4">
        {accounts?.length ? (
          <div>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                name={account.name}
                value={account.totalValue}
                currency={mainCurrency}
              />
            ))}
          </div>
        ) : (
          <NoAccountsPlaceholder />
        )}
      </div>
    </main>
  );
}
