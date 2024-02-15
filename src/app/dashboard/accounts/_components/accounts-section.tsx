import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { NoAccountsPlaceholder } from './no-accounts-placeholder';

interface AccountsSectionProps {
  accounts: SimpleAccount[];
}

export function AccountsSection({ accounts }: AccountsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between space-y-0">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>All accounts you have.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{account.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{account.name}</p>
              <p className="text-sm text-muted-foreground">{account.currency}</p>
            </div>
            <div className="ml-auto font-bold">
              {formatCurrency(account.value, account.currency)}
            </div>
          </div>
        ))}
        {!accounts.length && <NoAccountsPlaceholder />}
      </CardContent>
    </Card>
  );
}
