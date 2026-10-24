import 'server-only';

import { cache } from 'react';

import { AuthenticationError } from '@/lib/api/errors';
import { getSupabaseClaims, SupabaseClaims } from '@/lib/supabase/server';
import { DbClient, getDb } from '@/server/db';

export interface SerializableApiContext {
  userId: string;
  claims: SupabaseClaims;
}

export interface FullApiContext extends SerializableApiContext {
  db: DbClient;
}

/**
 * Returns the serializable context of the current user, or null if the request has no valid session.
 *
 * The context needs to be serializable to enable caching of API queries using 'use cache'.
 */
export const getSerializableApiContext = cache(async (): Promise<SerializableApiContext | null> => {
  const claims = await getSupabaseClaims();
  return claims && { userId: claims.sub, claims };
});

/**
 * Creates a serializable context object which will be accessible from all authenticated API functions.
 *
 * @throws AuthenticationError if the request has no valid session
 * @returns The context object
 */
export const createSerializableApiContext = cache(async (): Promise<SerializableApiContext> => {
  const ctx = await getSerializableApiContext();
  if (!ctx) {
    throw new AuthenticationError('User not authenticated');
  }
  return ctx;
});

/**
 * Creates a full context object which will be accessible from all authenticated API functions.
 *
 * The context returned by this function is not serializable and should not be used as argument for cached functions.
 *
 * @returns The context object
 */
export const createFullApiContext = cache(
  async (serializableCtx?: SerializableApiContext): Promise<FullApiContext> => {
    const serializableContext = serializableCtx ?? (await createSerializableApiContext());
    const db = await getDb(serializableContext.claims);

    return { ...serializableContext, db };
  },
);
