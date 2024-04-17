import { Suspense } from 'react';

import { CreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { UpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog';
import { UpsertAccountDialog } from '@/components/dialogs/upsert-account-dialog';

export function GlobalDialogs() {
  return (
    <Suspense fallback={null}>
      <UpsertAccountDialog />
      <CreateTransactionDialog />
      <UpdateTransactionDialog />
    </Suspense>
  );
}
