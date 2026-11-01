import { BalanceDistributionChart } from '@/components/charts/balance-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { capitalize, formatCurrency } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';
import { apiQueries } from '@/server/api/queries';

export async function AssetDistributionCard() {
  const accounts = await apiQueries.accounts.getAccounts();
  const { mainCurrency } = await apiQueries.currencies.getMainCurrencyWithMapper();
  const subaccounts = accounts.flatMap((account) => account.subaccounts);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category">
          <TabsList>
            <TabsTrigger value="category">By Category</TabsTrigger>
            <TabsTrigger value="currency">By Currency</TabsTrigger>
          </TabsList>
          <TabsContent value="category">
            <BalanceDistributionChart
              label="Category"
              groups={Object.entries(groupBy(accounts, (account) => account.category)).map(
                ([category, items]) => ({
                  name: capitalize(category),
                  balance: sum(items.map((account) => account.totalBalance)),
                }),
              )}
              mainCurrency={mainCurrency}
            />
          </TabsContent>
          <TabsContent value="currency">
            <BalanceDistributionChart
              label="Currency"
              groups={Object.entries(groupBy(subaccounts, (item) => item.originalCurrency))
                .map(([currency, items]) => ({
                  name: currency.toUpperCase(),
                  balance: sum(items.map((item) => item.balance.mainCurrencyValue)),
                  detail:
                    currency === mainCurrency
                      ? undefined
                      : formatCurrency(
                          sum(items.map((item) => item.balance.originalValue)),
                          currency,
                        ),
                }))
                .filter((item) => item.balance)
                .toSorted((a, b) => b.balance - a.balance)}
              mainCurrency={mainCurrency}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
