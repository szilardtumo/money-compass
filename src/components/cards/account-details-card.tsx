import { Card, CardContent } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import { Account } from '@/lib/types/accounts.types';

interface AccountDetailsCardProps {
  account: Account;
}

export function AccountDetailsCard({ account }: AccountDetailsCardProps) {
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
