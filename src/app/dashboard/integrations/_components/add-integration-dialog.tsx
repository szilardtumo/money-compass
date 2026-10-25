import { apiQueries } from '@/server/api/queries';

import { AddIntegrationDialogClient } from './add-integration-dialog-client';

const countries = [
  { label: 'Hungary', value: 'HU' },
  { label: 'Romania', value: 'RO' },
];

export async function AddIntegrationDialog() {
  const institutions = await Promise.all(
    countries.map((country) => apiQueries.integrations.getInstitutions(country.value)),
  );

  return <AddIntegrationDialogClient countries={countries} institutions={institutions.flat()} />;
}
