import { HoldingsTable } from '@/components/investments/holdings-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiQueries } from '@/server/api/queries';

export async function HoldingsCard() {
  const [holdings, { mainCurrency }] = await Promise.all([
    apiQueries.investments.getHoldings(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <HoldingsTable holdings={holdings} mainCurrency={mainCurrency} />
      </CardContent>
    </Card>
  );
}
