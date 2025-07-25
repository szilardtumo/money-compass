import { apiQueries } from '@/server/api/queries';

import { CreateAccountDialogClient } from './create-account-dialog-client';

export async function CreateAccountDialog() {
  const currencies = await apiQueries.currencies.getCurrencies();

  return <CreateAccountDialogClient currencies={currencies} />;
}
