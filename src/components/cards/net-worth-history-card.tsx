import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface NetWorthHistoryCardProps {
  data: TransactionHistory[];
  accounts: Account[];
}

export async function NetWorthHistoryCard({ data, accounts }: NetWorthHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart accounts={accounts} data={data} stack={false} />
      </CardContent>
    </Card>
  );
}
