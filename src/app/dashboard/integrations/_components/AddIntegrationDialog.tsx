import { apiQueries } from '@/server/api/queries';

import { AddIntegrationDialogClient } from './AddIntegrationDialogClient';

export async function AddIntegrationDialog() {
  const gocardlessInstitutions = await apiQueries.integrations.getGocardlessInstitutions();

  return <AddIntegrationDialogClient gocardlessInstitutions={gocardlessInstitutions} />;
}
