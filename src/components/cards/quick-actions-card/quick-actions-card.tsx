import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiQueries } from '@/server/api/queries';

import { UpdateBalancesDialog } from './update-balances-dialog';

export async function QuickActionsCard() {
  const accounts = await apiQueries.accounts.getSimpleAccounts();

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between space-y-0">
        <div>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Get things done. Fast.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <UpdateBalancesDialog accounts={accounts} />
      </CardContent>
    </Card>
  );
}
