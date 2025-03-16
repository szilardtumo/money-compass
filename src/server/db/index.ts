import 'server-only';

import { sql } from 'drizzle-orm';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

import { env } from '@/lib/env';
import { getSupabaseToken, SupabaseToken } from '@/lib/supabase/server';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var drizzleClient: PostgresJsDatabase<typeof schema> | undefined;
}

const drizzleClient =
  global.drizzleClient ||
  drizzle({
    client: postgres(env.DATABASE_URL, { prepare: false }),
    schema,
    casing: 'snake_case',
  });
if (process.env.NODE_ENV !== 'production') global.drizzleClient = drizzleClient;

/**
 * Returns the drizzle DB client.
 *
 * The Supabase token will be retrieved using cookies.
 *
 * @deprecated Calling this method without parameters is deprecated. Provide the Supabase token as a parameter.
 */
async function getDb(): Promise<{
  admin: typeof drizzleClient;
  rls: typeof drizzleClient.transaction;
}>;

/**
 * Retrieves the Drizzle DB client with Supabase token for RLS.
 *
 * If no Supabase token is provided, it will be retrieved using cookies.
 *
 * @param supabaseToken - The Supabase token for Row-Level Security.
 */
async function getDb(
  supabaseToken: SupabaseToken,
): Promise<{ admin: typeof drizzleClient; rls: typeof drizzleClient.transaction }>;

async function getDb(supabaseToken?: SupabaseToken) {
  if (!supabaseToken) {
    supabaseToken = await getSupabaseToken();
  }

  return {
    admin: drizzleClient,
    rls: (async (transaction, ...rest) => {
      return await drizzleClient.transaction(
        async (tx) => {
          // Supabase exposes auth.uid() and auth.jwt()
          // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
          try {
            await tx.execute(sql`
                -- auth.jwt()
                select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(supabaseToken))}', TRUE);
                -- auth.uid()
                select set_config('request.jwt.claim.sub', '${sql.raw(supabaseToken.sub ?? '')}', TRUE);												
                -- set local role
                set local role ${sql.raw(supabaseToken.role ?? 'anon')};
            `);
            return await transaction(tx);
          } finally {
            await tx.execute(sql`
                -- reset
                select set_config('request.jwt.claims', NULL, TRUE);
                select set_config('request.jwt.claim.sub', NULL, TRUE);
                reset role;
            `);
          }
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

export type DbClient = ReturnType<typeof getDb>;
export type DbClientTx = Parameters<Parameters<typeof drizzleClient.transaction>[0]>[0];

const cachedGetAdminDb = cache(getAdminDb);
const cachedGetDb = cache(getDb);

export { schema, cachedGetDb as getDb, cachedGetAdminDb as getAdminDb };
