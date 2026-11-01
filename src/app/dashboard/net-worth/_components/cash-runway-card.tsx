import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { formatCurrency } from '@/lib/utils/formatters';
import { apiQueries } from '@/server/api/queries';

/**
 * How many months the cash covers at the average spending of the last 12 full months, or of fewer
 * when the transactions start later.
 */
export async function CashRunwayCard({ className }: { className?: string }) {
  const [accounts, { mainCurrency, months }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.analytics.getMonthlyCashFlow(),
  ]);
  const cash = accounts
    .filter((account) => account.category === 'checking')
    .reduce((total, account) => total + account.totalBalance, 0);
  // Without this month, which isn't over yet
  const fullMonths = months.slice(0, -1);
  const counted = fullMonths.slice(
    Math.max(
      fullMonths.findIndex((item) => item.spending || item.income),
      0,
    ),
  );
  const spending = counted.reduce((total, item) => total + item.spending, 0) / counted.length;
  const runway = (cash / spending).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cash runway</CardTitle>
        <CardDescription>How long your cash lasts at your usual spending</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Metric>
          {spending > 0 ? `${runway} month${runway === '1' ? '' : 's'}` : 'No spending yet'}
        </Metric>
        <p className="text-sm text-muted-foreground">
          {format(cash)} in checking accounts, {format(spending)} spent in an average month of the
          last {counted.length}
        </p>
      </CardContent>
    </Card>
  );
}
