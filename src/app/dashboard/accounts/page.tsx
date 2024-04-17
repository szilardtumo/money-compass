import { AccountsCard } from '@/components/cards/accounts-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';

export default async function AccountsPage() {
  const accounts = await getSimpleAccounts();

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Accounts</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <QuickActionsCard />

        <AccountsCard accounts={accounts} />
      </PageContent>
    </PageLayout>
  );
}
