'use client';

import { ComponentProps } from 'react';

import { createDialogContext } from '@/lib/create-dialog-context';

import type { UpdateTransactionForm } from './update-transaction-form';

type DefaultValues = ComponentProps<typeof UpdateTransactionForm>['defaultValues'] & {
  currency: string;
};

const { Provider: UpdateTransactionDialogProvider, useDialog: useUpdateTransactionDialog } =
  createDialogContext<DefaultValues>('updateTransaction');

export { UpdateTransactionDialogProvider, useUpdateTransactionDialog };
