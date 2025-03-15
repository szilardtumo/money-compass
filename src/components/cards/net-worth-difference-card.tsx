import { NetWorthDifferenceChart } from '@/components/charts/net-worth-difference-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiQueries } from '@/server/api/queries';

export async function NetWorthDifferenceCard() {
  const data = await apiQueries.transactions.getTransactionHistory({
    dateRange: '12 month',
    interval: '1 month',
  });

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
