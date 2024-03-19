'use client';

import { TabsContent } from '@radix-ui/react-tabs';

import { AccountCategoryDistributionChart } from '@/components/charts/account-category-distribution-chart';
import { AccountDistributionChart } from '@/components/charts/account-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';

interface AssetDistributionCardProps {
  accounts: SimpleAccount[];
  currencyMapper: CurrencyMapper;
}

export function AssetDistributionCard({ accounts, currencyMapper }: AssetDistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">By Account</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <AccountDistributionChart accounts={accounts} currencyMapper={currencyMapper} />
          </TabsContent>
          <TabsContent value="category">
            <AccountCategoryDistributionChart accounts={accounts} currencyMapper={currencyMapper} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
