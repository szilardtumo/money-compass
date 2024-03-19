'use client';

import { ComponentProps } from 'react';

import type { CreateTransactionForm } from '@/components/dialogs/create-transaction-dialog/create-transaction-form';
import { createDialogContext } from '@/lib/create-dialog-context';

type DefaultValues = ComponentProps<typeof CreateTransactionForm>['defaultValues'];

const { Provider: CreateTransactionDialogProvider, useDialog: useCreateTransactionDialog } =
  createDialogContext<DefaultValues>('createTransaction');

export { CreateTransactionDialogProvider, useCreateTransactionDialog };
