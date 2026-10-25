import 'server-only';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

import { AuthenticationError } from '@/lib/api/errors';
import { env } from '@/lib/env';
import { getSupabaseClaims, SupabaseClaims } from '@/lib/supabase/server';

import * as schema from './schema';

declare global {
  var postgresClient: postgres.Sql | undefined;
}

// Only the connection outlives hot reloads in development. Drizzle is rebuilt, so it sees schema changes.
const postgresClient = global.postgresClient ?? postgres(env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== 'production') global.postgresClient = postgresClient;

const drizzleClient = drizzle({ client: postgresClient, schema, casing: 'snake_case' });

type DbTx = Parameters<Parameters<typeof drizzleClient.transaction>[0]>[0];

/**
 * Retrieves the Drizzle DB client with the user's claims for Row-Level Security.
 *
 * @param claims The verified claims of the user. Read from the session cookies if not provided.
 * @throws AuthenticationError if there is no authenticated user
 */
async function getDb(claims?: SupabaseClaims | null) {
  claims ??= await getSupabaseClaims();
  if (claims?.role !== 'authenticated') {
    throw new AuthenticationError('User not authenticated');
  }

  return {
    admin: drizzleClient,
    rls: (async (transaction, ...rest) => {
      return await drizzleClient.transaction(
        async (tx) => {
          // Supabase's auth.uid() and auth.jwt() read the claims settings. All three settings,
          // including the role, are local to the transaction.
          // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
          await tx.execute(
            sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true), set_config('request.jwt.claim.sub', ${claims.sub}, true), set_config('role', 'authenticated', true)`,
          );
          return await transaction(tx);
        },
        ...rest,
      );
    }) as typeof drizzleClient.transaction,
  };
}

/**
 * Retrieves the Drizzle DB client with admin access only.
 */
async function getAdminDb() {
  return {
    admin: drizzleClient,
  };
}

export type DbClient = Awaited<ReturnType<typeof getDb>>;
export type DbClientTx = Parameters<Parameters<typeof drizzleClient.transaction>[0]>[0];

const cachedGetAdminDb = cache(getAdminDb);
const cachedGetDb = cache(getDb);

export { schema, cachedGetDb as getDb, cachedGetAdminDb as getAdminDb, type DbTx };
