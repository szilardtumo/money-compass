import { Card, CardContent } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import { apiQueries } from '@/server/api/queries';

interface AccountDetailsCardProps {
  accountId: string;
}

export async function AccountDetailsCard({ accountId }: AccountDetailsCardProps) {
  const account = await apiQueries.accounts.getAccount(accountId);

  if (!account) return null;

  return (
    <Card>
      <CardContent className="p-6 w-fit mx-auto flex flex-col sm:flex-row sm:w-full gap-8 justify-around">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Category</p>
          <p className="text-xl font-bold capitalize">{account.category}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Balance</p>
          <Currency
            className="text-xl font-bold"
            value={account.totalBalance}
            currency={account.mainCurrency}
          />
        </div>
      </CardContent>
    </Card>
  );
}
