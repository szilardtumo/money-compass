import { Suspense } from 'react';

import { CreateTransactionDialogProvider } from '@/components/dialogs/create-transaction-dialog';
import { CreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog/create-transaction-dialog';
import { UpdateTransactionDialogProvider } from '@/components/dialogs/update-transaction-dialog';
import { UpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog/update-transaction-dialog';
import { UpsertAccountDialogProvider } from '@/components/dialogs/upsert-account-dialog';
import { UpsertAccountDialog } from '@/components/dialogs/upsert-account-dialog/upsert-account-dialog';

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
