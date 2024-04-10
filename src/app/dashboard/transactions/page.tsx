import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';

import { CreateTransactionButton } from './_components/create-transaction-button';
import { TransactionsTable } from './_components/transactions-table';

export default function AccountDetailsPage() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Transactions</PageHeaderTitle>
        <CreateTransactionButton />
      </PageHeader>

      <PageContent>
        <TransactionsTable />
      </PageContent>
    </PageLayout>
  );
}
