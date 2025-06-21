import 'server-only';

import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { getSupabaseToken, SupabaseToken } from '@/lib/supabase/server';
import { DbClient, getDb } from '@/server/db';

export interface SerializableApiContext {
  plainCookies: RequestCookie[];
  supabaseToken: SupabaseToken;
  userId: string;
}

export interface FullApiContext extends SerializableApiContext {
  db: DbClient;
}

/**
 * Creates a serializable context object which will be accessible from all authenticated API functions.
 *
 * The context returned by this function needs to be serializable to enable caching of API queries using 'use cache'.
 *
 * @returns The context object
 */
export const createSerializableApiContext = cache(async (): Promise<SerializableApiContext> => {
  const plainCookies = (await cookies()).getAll();
  const supabaseToken = await getSupabaseToken();

  return { plainCookies, supabaseToken, userId: supabaseToken.sub ?? 'anon' };
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
    const db = await getDb(serializableContext.supabaseToken);

    return { ...serializableContext, db };
  },
);
