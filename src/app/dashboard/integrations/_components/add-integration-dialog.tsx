import { apiQueries } from '@/server/api/queries';

import { AddIntegrationDialogClient } from './add-integration-dialog-client';

export async function AddIntegrationDialog() {
  const institutions = await apiQueries.integrations.getInstitutions();

  return (
    <AddIntegrationDialogClient
      institutions={institutions
        .map(({ name, country }) => ({ name, country }))
        .toSorted((a, b) => a.name.localeCompare(b.name) || a.country.localeCompare(b.country))}
    />
  );
}
