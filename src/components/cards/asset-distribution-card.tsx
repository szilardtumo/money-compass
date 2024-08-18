'use client';

import { TabsContent } from '@radix-ui/react-tabs';

import { AccountCategoryDistributionChart } from '@/components/charts/account-category-distribution-chart';
import { AccountDistributionChart } from '@/components/charts/account-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';

interface AssetDistributionCardProps {
  accounts: Account[];
  mainCurrency: string;
}

export function AssetDistributionCard({ accounts, mainCurrency }: AssetDistributionCardProps) {
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
            <AccountDistributionChart accounts={accounts} mainCurrency={mainCurrency} />
          </TabsContent>
          <TabsContent value="category">
            <AccountCategoryDistributionChart accounts={accounts} mainCurrency={mainCurrency} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
