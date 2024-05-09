import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthDifferenceCard } from '@/components/cards/net-worth-difference-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getMainCurrencyWithMapper } from '@/lib/db/currencies.queries';
import { getTransactionHistory } from '@/lib/db/transactions.queries';

export default async function StatisticsPage() {
  const [accounts, transactionHistory, { mainCurrency }] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
    getMainCurrencyWithMapper(),
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
