'use client';

import { ComponentProps } from 'react';

import { createDialogContext } from '@/lib/create-dialog-context';

import type { UpdateAccountForm } from './update-account-form';

type DefaultValues = ComponentProps<typeof UpdateAccountForm>['defaultValues'];

const { Provider: UpdateAccountDialogProvider, useDialog: useUpdateAccountDialog } =
  createDialogContext<DefaultValues>('updateAccount');

export { UpdateAccountDialogProvider, useUpdateAccountDialog };
