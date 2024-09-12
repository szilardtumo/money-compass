'use client';

import { ComponentProps } from 'react';

import type { UpdateTransactionForm } from '@/components/dialogs/update-transaction-dialog/update-transaction-form';
import { createDialogContext } from '@/lib/create-dialog-context';

type DefaultValues = ComponentProps<typeof UpdateTransactionForm>['defaultValues'] & {
  currency: string;
};

const { Provider: UpdateTransactionDialogProvider, useDialog: useUpdateTransactionDialog } =
  createDialogContext<DefaultValues>('updateTransaction');

export { UpdateTransactionDialogProvider, useUpdateTransactionDialog };
