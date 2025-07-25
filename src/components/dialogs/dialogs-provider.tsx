import { Suspense } from 'react';

import { CreateAccountDialogProvider } from '@/components/dialogs/create-account-dialog';
import { CreateAccountDialog } from '@/components/dialogs/create-account-dialog/create-account-dialog';
import { CreateTransactionDialogProvider } from '@/components/dialogs/create-transaction-dialog';
import { CreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog/create-transaction-dialog';
import { UpdateAccountDialogProvider } from '@/components/dialogs/update-account-dialog';
import { UpdateAccountDialog } from '@/components/dialogs/update-account-dialog/update-account-dialog';
import { UpdateTransactionDialogProvider } from '@/components/dialogs/update-transaction-dialog';
import { UpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog/update-transaction-dialog';

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  return (
    <CreateTransactionDialogProvider>
      <UpdateTransactionDialogProvider>
        <CreateAccountDialogProvider>
          <UpdateAccountDialogProvider>
            {children}
            <Suspense fallback={null}>
              <CreateAccountDialog />
              <UpdateAccountDialog />
              <CreateTransactionDialog />
              <UpdateTransactionDialog />
            </Suspense>
          </UpdateAccountDialogProvider>
        </CreateAccountDialogProvider>
      </UpdateTransactionDialogProvider>
    </CreateTransactionDialogProvider>
  );
}
