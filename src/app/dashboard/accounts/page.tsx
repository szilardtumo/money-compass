import { Suspense } from 'react';

import { AccountsCard } from '@/components/cards/accounts-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Accounts</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[220px]" />}>
        <QuickActionsCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <AccountsCard />
      </Suspense>
    </>
  );
}
