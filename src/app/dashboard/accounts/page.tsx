import { AccountsCard } from '@/components/cards/accounts-card';
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
        <AccountsCard accounts={accounts} />
      </PageContent>
    </PageLayout>
  );
}
