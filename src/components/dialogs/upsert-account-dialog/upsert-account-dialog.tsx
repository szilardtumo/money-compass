import { getCurrencies } from '@/lib/db/currencies.queries';

import { UpsertAccountDialogClient } from './upsert-account-dialog-client';

export async function UpsertAccountDialog() {
  const currencies = await getCurrencies();

  return <UpsertAccountDialogClient currencies={currencies} />;
}
