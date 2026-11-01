import { apiQueries } from '@/server/api/queries';

import { AccountDropdown } from './account-dropdown';

export async function AccountSection() {
  const profile = await apiQueries.profiles.getProfile();

  return <AccountDropdown profile={profile} />;
}
