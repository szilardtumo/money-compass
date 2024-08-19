import 'server-only';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { jwtDecode } from 'jwt-decode';
import postgres from 'postgres';
import React from 'react';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import * as schema from './schema';
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

export const getDb = React.cache(async () => {
  const supabase = createServerSupabaseClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const decodedToken = token
    ? jwtDecode<{ sub: string; email: string; role: string }>(token)
    : null;

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  return new Proxy<typeof db>(db, {
    get(target, prop) {
      if (prop === 'transaction') {
        return (async (transaction, ...rest) => {
          return await target.transaction(
            async (tx) => {
              // Emulates RLS
              // https://github.com/drizzle-team/drizzle-orm/issues/594
              if (decodedToken) {
                await tx.execute(sql`
                          select set_config('request.jwt.claims', '${sql.raw(
                            JSON.stringify(decodedToken),
                          )}', TRUE);
                          select set_config('request.jwt.claim.sub', '${sql.raw(
                            decodedToken.sub ?? '',
                          )}', TRUE);
                          select set_config('request.jwt.claim.email', '${sql.raw(
                            decodedToken.email,
                          )}', TRUE);
                          select set_config('request.jwt.claim.role', '${sql.raw(
                            decodedToken.role,
                          )}', TRUE);
                          set local role ${sql.raw(decodedToken.role)};
                      `);
              } else {
                await tx.execute(sql`
                  select set_config('request.jwt.claims', NULL, TRUE);
                  select set_config('request.jwt.claim.sub', NULL, TRUE);
                  select set_config('request.jwt.claim.email', NULL, TRUE);
                  select set_config('request.jwt.claim.role', NULL, TRUE);
                  set local role anon;
              `);
              }

              return await transaction(tx);
            },
            ...rest,
          );
        }) as typeof db.transaction;
      }
    },
  });
});

export { schema };
