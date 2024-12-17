import { AccountAvatar } from '@/components/ui/account-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import { NavLink } from '@/components/ui/nav-link';
import { apiQueries } from '@/server/api/queries';

import { AccountActionsDropdown } from './account-actions-dropdown';
import { CreateAccountButton } from './create-account-button';
import { NoAccountsPlaceholder } from './no-accounts-placeholder';

export async function AccountsCard() {
  const accounts = await apiQueries.accounts.getAccounts();

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between space-y-0">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>All accounts you have.</CardDescription>
        </div>
        <CreateAccountButton />
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-4">
            <AccountAvatar category={account.category} className="hidden sm:flex" />
            <div className="space-y-1">
              <NavLink
                href={`/dashboard/accounts/${account.id}`}
                className="text-sm font-medium leading-none"
              >
                {account.name}
              </NavLink>
              <p className="text-sm text-muted-foreground">
                <span className="capitalize">{account.category}</span>
              </p>
            </div>
            <Currency
              value={account.totalBalance}
              currency={account.mainCurrency}
              className="ml-auto font-bold"
            />
            <AccountActionsDropdown account={account} className="hidden sm:inline-flex" />
          </div>
        ))}
        {!accounts.length && <NoAccountsPlaceholder />}
      </CardContent>
    </Card>
  );
}
