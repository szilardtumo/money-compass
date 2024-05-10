import { NetWorthDifferenceChart } from '@/components/charts/net-worth-difference-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface NetWorthDifferenceCardProps {
  data: TransactionHistory[];
}

export async function NetWorthDifferenceCard({ data }: NetWorthDifferenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Difference</CardTitle>
      </CardHeader>
      <CardContent>
        <NetWorthDifferenceChart data={data} />
      </CardContent>
    </Card>
  );
}
