'use client';

import { ComponentProps } from 'react';

import { createDialogContext } from '@/lib/create-dialog-context';

import type { UpsertAccountForm } from './upsert-account-form';

type DefaultValues = ComponentProps<typeof UpsertAccountForm>['defaultValues'];

const { Provider: UpsertAccountDialogProvider, useDialog: useUpsertAccountDialog } =
  createDialogContext<DefaultValues>('upsertAccount');

export { UpsertAccountDialogProvider, useUpsertAccountDialog };
