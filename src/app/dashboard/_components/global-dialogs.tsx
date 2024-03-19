import { Suspense } from 'react';

import { CreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';

export function GlobalDialogs() {
  return (
    <Suspense fallback={null}>
      <CreateTransactionDialog />
    </Suspense>
  );
}
