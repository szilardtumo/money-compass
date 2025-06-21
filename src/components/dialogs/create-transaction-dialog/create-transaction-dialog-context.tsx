'use client';

import { ComponentProps } from 'react';

import { createDialogContext } from '@/lib/create-dialog-context';

import type { CreateTransactionForm } from './create-transaction-form';

type DefaultValues = ComponentProps<typeof CreateTransactionForm>['defaultValues'];

const { Provider: CreateTransactionDialogProvider, useDialog: useCreateTransactionDialog } =
  createDialogContext<DefaultValues>('createTransaction');

export { CreateTransactionDialogProvider, useCreateTransactionDialog };
