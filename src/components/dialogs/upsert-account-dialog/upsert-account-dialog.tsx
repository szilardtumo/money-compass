import { apiQueries } from '@/server/api/queries';

import { UpsertAccountDialogClient } from './upsert-account-dialog-client';

export async function UpsertAccountDialog() {
  const currencies = await apiQueries.currencies.getCurrencies();

  return <UpsertAccountDialogClient currencies={currencies} />;
}
