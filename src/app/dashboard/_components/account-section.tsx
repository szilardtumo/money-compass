import { apiQueries } from '@/server/api/queries';

import { AccountDropdown } from './account-dropdown';

export async function AccountSection() {
  const [profile, currencies] = await Promise.all([
    apiQueries.profiles.getProfile(),
    apiQueries.currencies.getCurrencies(),
  ]);

  return <AccountDropdown profile={profile} currencies={currencies} />;
}
