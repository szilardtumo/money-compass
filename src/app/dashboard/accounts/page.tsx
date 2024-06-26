import { AccountsCard } from '@/components/cards/accounts-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';

export default function AccountsPage() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Accounts</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <QuickActionsCard />
        <AccountsCard />
      </PageContent>
    </PageLayout>
  );
}
