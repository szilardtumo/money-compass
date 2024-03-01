import { TransactionHistoryChart } from '@/components/charts/net-worth-chart';
import { TransactionHistory } from '@/lib/types/transactions.types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface NetWorthCardProps {
  data: TransactionHistory[];
}

export function NetWorthCard({ data }: NetWorthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart data={data} />
      </CardContent>
    </Card>
  );
}
