import { Suspense } from 'react';

import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { CreateTransactionButton } from './_components/create-transaction-button';
import { TransactionsTable } from './_components/transactions-table';

export default function AccountDetailsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Transactions</PageHeaderTitle>
        <CreateTransactionButton />
      </PageHeaderSlotContent>

      <Suspense
        fallback={
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="ml-auto h-8 w-[100px]" />
            </div>
            <Skeleton className="h-[650px] w-full" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        }
      >
        <TransactionsTable />
      </Suspense>
    </>
  );
}
