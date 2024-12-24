import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthDifferenceCard } from '@/components/cards/net-worth-difference-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

export default async function StatisticsPage() {
  const [accounts, transactionHistory, { mainCurrency }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactionHistory({ dateRange: '12 month', interval: '1 month' }),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Statistics</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <NetWorthHistoryCard data={transactionHistory} accounts={accounts} />
        <NetWorthDifferenceCard data={transactionHistory} />
        <AssetDistributionCard accounts={accounts} mainCurrency={mainCurrency} />
      </PageContent>
    </PageLayout>
  );
}
