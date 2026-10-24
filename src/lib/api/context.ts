import 'server-only';

import { cache } from 'react';

import { AuthenticationError } from '@/lib/api/errors';
import { getSupabaseClaims, SupabaseClaims } from '@/lib/supabase/server';
import { DbClient, getDb } from '@/server/db';

export interface ApiContext {
  userId: string;
  claims: SupabaseClaims;
  db: DbClient;
}

// Supabase checks the token expiry against the current time, which Next.js only allows inside a
// cache scope while it prerenders. A private cache scope can still read the request's cookies.
async function getClaims() {
  'use cache: private';
  return getSupabaseClaims();
}

/**
 * Creates the context of the current user, which is accessible from all authenticated API functions.
 *
 * @throws AuthenticationError if the request has no valid session
 */
export const createApiContext = cache(async (): Promise<ApiContext> => {
  const claims = await getClaims();
  if (!claims) {
    throw new AuthenticationError('User not authenticated');
  }

  return { userId: claims.sub, claims, db: await getDb(claims) };
});
