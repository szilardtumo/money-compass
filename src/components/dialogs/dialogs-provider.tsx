import { Suspense } from 'react';

import { AddToTripDialogProvider } from '@/components/dialogs/add-to-trip-dialog';
import { AddToTripDialog } from '@/components/dialogs/add-to-trip-dialog/add-to-trip-dialog';
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
            <AddToTripDialogProvider>
              {children}
              <Suspense fallback={null}>
                <CreateAccountDialog />
                <UpdateAccountDialog />
                <CreateTransactionDialog />
                <UpdateTransactionDialog />
                <AddToTripDialog />
              </Suspense>
            </AddToTripDialogProvider>
          </UpdateAccountDialogProvider>
        </CreateAccountDialogProvider>
      </UpdateTransactionDialogProvider>
    </CreateTransactionDialogProvider>
  );
}
