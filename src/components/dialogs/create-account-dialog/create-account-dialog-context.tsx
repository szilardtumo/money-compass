'use client';

import { ComponentProps } from 'react';

import { createDialogContext } from '@/lib/create-dialog-context';

import type { CreateAccountForm } from './create-account-form';

type DefaultValues = ComponentProps<typeof CreateAccountForm>['defaultValues'];

const { Provider: CreateAccountDialogProvider, useDialog: useCreateAccountDialog } =
  createDialogContext<DefaultValues>('createAccount');

export { CreateAccountDialogProvider, useCreateAccountDialog };
