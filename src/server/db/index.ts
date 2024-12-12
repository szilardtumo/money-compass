import 'server-only';

import { sql } from 'drizzle-orm';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { jwtDecode } from 'jwt-decode';
import postgres from 'postgres';
import React from 'react';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var drizzleClient: PostgresJsDatabase<typeof schema> | undefined;
}

type SupabaseToken = {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  role?: string;
};

const drizzleClient =
  global.drizzleClient ||
  drizzle({
    client: postgres(process.env.DATABASE_URL!, { prepare: false }),
    schema,
    casing: 'snake_case',
  });
if (process.env.NODE_ENV !== 'production') global.drizzleClient = drizzleClient;

export const getDb = React.cache(async () => {
  const supabase = await createServerSupabaseClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const decodedToken: SupabaseToken = token ? jwtDecode<SupabaseToken>(token) : { role: 'anon' };

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
                select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(decodedToken))}', TRUE);
                -- auth.uid()
                select set_config('request.jwt.claim.sub', '${sql.raw(decodedToken.sub ?? '')}', TRUE);												
                -- set local role
                set local role ${sql.raw(decodedToken.role ?? 'anon')};
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
});
export { schema };
