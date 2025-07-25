import { apiQueries } from '@/server/api/queries';

import { UpdateAccountDialogClient } from './update-account-dialog-client';

export async function UpdateAccountDialog() {
  const currencies = await apiQueries.currencies.getCurrencies();

  return <UpdateAccountDialogClient currencies={currencies} />;
}
