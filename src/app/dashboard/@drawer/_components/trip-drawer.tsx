import { apiQueries } from '@/server/api/queries';

import { TripDrawerClient } from './trip-drawer-client';

/**
 * The drawer of a trip, with its cost by category and its transactions.
 */
export async function TripDrawer({ tripId }: { tripId: string }) {
  const [trips, categories, { data: transactions }, accounts, profile] = await Promise.all([
    apiQueries.trips.getTrips(),
    apiQueries.categories.getCategories(),
    apiQueries.transactions.getTransactions({ tripId, pageSize: 10_000 }),
    apiQueries.accounts.getAccounts(),
    apiQueries.profiles.getProfile(),
  ]);
  const trip = trips.find((item) => item.id === tripId);
  // A deleted trip closes the drawer
  if (!trip) {
    return null;
  }

  return (
    <TripDrawerClient
      trip={trip}
      categories={categories}
      transactions={transactions}
      accounts={accounts}
      mainCurrency={profile.mainCurrency}
    />
  );
}
