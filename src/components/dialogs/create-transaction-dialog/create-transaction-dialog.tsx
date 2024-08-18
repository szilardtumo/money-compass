'use server';

import { apiQueries } from '@/server/api/queries';

import { CreateTransactionDialogClient } from './create-transaction-dialog-client';

export async function CreateTransactionDialog() {
  const accounts = await apiQueries.accounts.getSimpleAccounts();

  return <CreateTransactionDialogClient accounts={accounts} />;
}
