import { AccountActionsDropdown } from '@/app/dashboard/accounts/_components/account-actions-dropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrencies } from '@/lib/db/currencies';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { CreateAccountDialog } from './create-account-dialog';
import { NoAccountsPlaceholder } from './no-accounts-placeholder';

interface AccountsSectionProps {
  accounts: SimpleAccount[];
}

export async function AccountsSection({ accounts }: AccountsSectionProps) {
  const currencies = await getCurrencies();

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between space-y-0">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>All accounts you have.</CardDescription>
        </div>
        <CreateAccountDialog currencies={currencies} />
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{account.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{account.name}</p>
              <p className="text-sm text-muted-foreground uppercase">{account.currency}</p>
            </div>
            <div className="ml-auto font-bold">
              {formatCurrency(account.value, account.currency)}
            </div>
            <AccountActionsDropdown account={account} />
          </div>
        ))}
        {!accounts.length && <NoAccountsPlaceholder />}
      </CardContent>
    </Card>
  );
}
