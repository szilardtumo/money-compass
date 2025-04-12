import { Suspense } from 'react';

import {
  CreateTransactionDialog,
  CreateTransactionDialogProvider,
} from '@/components/dialogs/create-transaction-dialog';
import {
  UpdateTransactionDialog,
  UpdateTransactionDialogProvider,
} from '@/components/dialogs/update-transaction-dialog';
import {
  UpsertAccountDialog,
  UpsertAccountDialogProvider,
} from '@/components/dialogs/upsert-account-dialog';

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  return (
    <CreateTransactionDialogProvider>
      <UpdateTransactionDialogProvider>
        <UpsertAccountDialogProvider>
          {children}
          <Suspense fallback={null}>
            <UpsertAccountDialog />
            <CreateTransactionDialog />
            <UpdateTransactionDialog />
          </Suspense>
        </UpsertAccountDialogProvider>
      </UpdateTransactionDialogProvider>
    </CreateTransactionDialogProvider>
  );
}
