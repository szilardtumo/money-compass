import { Card, CardContent } from '@/components/ui/card';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';

interface AccountDetailsCardProps {
  account: SimpleAccount;
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
          <p className="text-muted-foreground text-xs mb-1">Currency</p>
          <p className="text-xl font-bold uppercase">{account.originalCurrency}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Balance</p>
          <p className="text-xl font-bold">
            {formatCurrency(account.balance.originalValue, account.originalCurrency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
