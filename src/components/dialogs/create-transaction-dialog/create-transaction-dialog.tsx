'use server';

import { getSimpleAccounts } from '@/lib/db/accounts.queries';

import { CreateTransactionDialogClient } from './create-transaction-dialog-client';

export async function CreateTransactionDialog() {
  const accounts = await getSimpleAccounts();

  return <CreateTransactionDialogClient accounts={accounts} />;
}
