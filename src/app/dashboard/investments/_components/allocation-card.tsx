import { BalanceDistributionChart } from '@/components/charts/balance-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { groupBy } from '@/lib/utils/group-by';
import { PortfolioSummary } from '@/server/api/investments/overview';

type Slice = PortfolioSummary['allocation'][number];

const KIND_LABELS = {
  stock: 'Stocks',
  etf: 'ETFs',
  fund: 'Funds',
  bond: 'Bonds',
  other: 'Other',
  cash: 'Cash',
} satisfies Record<Slice['kind'], string>;

const GROUPINGS = [
  { label: 'Account', getName: (slice: Slice) => slice.account },
  { label: 'Currency', getName: (slice: Slice) => slice.currency.toUpperCase() },
  { label: 'Kind', getName: (slice: Slice) => KIND_LABELS[slice.kind] },
];

export function AllocationCard({ summary }: { summary: PortfolioSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Account">
          <TabsList>
            {GROUPINGS.map(({ label }) => (
              <TabsTrigger key={label} value={label}>
                By {label.toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {GROUPINGS.map(({ label, getName }) => (
            <TabsContent key={label} value={label}>
              <BalanceDistributionChart
                label={label}
                groups={Object.entries(groupBy(summary.allocation, getName))
                  .map(([name, slices]) => ({
                    name,
                    balance: slices.reduce((total, slice) => total + slice.value, 0),
                  }))
                  // A slice can't be negative, like cash borrowed on margin
                  .filter((group) => group.balance > 0)
                  .toSorted((a, b) => b.balance - a.balance)}
                mainCurrency={summary.mainCurrency}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
