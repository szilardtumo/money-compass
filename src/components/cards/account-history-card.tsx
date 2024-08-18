import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface AccountHistoryCardProps {
  data: TransactionHistory[];
  account: Account;
  title?: string;
}

export async function AccountHistoryCard({
  data,
  account,
  title = `${account.name} account`,
}: AccountHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart accounts={[account]} data={data} stack={false} />
      </CardContent>
    </Card>
  );
}
