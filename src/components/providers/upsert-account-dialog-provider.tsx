'use client';

import { ComponentProps } from 'react';

import type { UpsertAccountForm } from '@/components/dialogs/upsert-account-dialog/upsert-account-form';
import { createDialogContext } from '@/lib/create-dialog-context';

type DefaultValues = ComponentProps<typeof UpsertAccountForm>['defaultValues'];

const { Provider: UpsertAccountDialogProvider, useDialog: useUpsertAccountDialog } =
  createDialogContext<DefaultValues>('upsertAccount');

export { UpsertAccountDialogProvider, useUpsertAccountDialog };
