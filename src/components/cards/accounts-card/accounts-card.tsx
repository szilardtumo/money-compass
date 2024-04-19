import { AccountAvatar } from '@/components/ui/account-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavLink } from '@/components/ui/nav-link';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { formatCurrency } from '@/lib/utils/formatters';

import { AccountActionsDropdown } from './account-actions-dropdown';
import { CreateAccountButton } from './create-account-button';
import { NoAccountsPlaceholder } from './no-accounts-placeholder';

export async function AccountsCard() {
  const accounts = await getSimpleAccounts();

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
                <span className="uppercase">{account.currency}</span>
                {' • '}
                <span className="capitalize">{account.category}</span>
              </p>
            </div>
            <div className="ml-auto font-bold">
              {formatCurrency(account.balance, account.currency)}
            </div>
            <AccountActionsDropdown account={account} className="hidden sm:inline-flex" />
          </div>
        ))}
        {!accounts.length && <NoAccountsPlaceholder />}
      </CardContent>
    </Card>
  );
}
