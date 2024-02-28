import { UpdateBalancesDialog } from '@/app/dashboard/accounts/_components/update-balances-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';

export async function QuickActionsSection() {
  const accounts = await getSimpleAccounts();

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
