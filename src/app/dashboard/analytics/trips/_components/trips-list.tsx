import { apiQueries } from '@/server/api/queries';

import { TripsListClient } from './trips-list-client';

export async function TripsList() {
  const [trips, categories, profile] = await Promise.all([
    apiQueries.trips.getTrips(),
    apiQueries.categories.getCategories(),
    apiQueries.profiles.getProfile(),
  ]);

  return (
    <TripsListClient trips={trips} categories={categories} mainCurrency={profile.mainCurrency} />
  );
}
