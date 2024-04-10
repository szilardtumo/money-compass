import { PageHeader, PageHeaderTitle } from '@/components/ui/page-header';

import { CreateTransactionButton } from './_components/create-transaction-button';
import { TransactionsTable } from './_components/transactions-table';

export default function AccountDetailsPage() {
  return (
    <main>
      <PageHeader>
        <PageHeaderTitle>Transactions</PageHeaderTitle>
        <CreateTransactionButton />
      </PageHeader>

      <div className="m-4 flex flex-col gap-4">
        <TransactionsTable />
      </div>
    </main>
  );
}
