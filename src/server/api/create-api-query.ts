import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { getSupabaseToken, SupabaseToken } from '@/lib/supabase/server';

interface AuthenticatedApiQueryContext {
  plainCookies: RequestCookie[];
  supabaseToken: SupabaseToken;
  userId: string;
}

/**
 * Creates a context object which will be accessible from all authenticated API queries.
 *
 * The context returned by this function needs to be serializable to enable caching of API queries using 'use cache'.
 *
 * @returns The context object
 */
const createAuthenticatedContext = cache(async (): Promise<AuthenticatedApiQueryContext> => {
  const plainCookies = (await cookies()).getAll();
  const supabaseToken = await getSupabaseToken();

  return { plainCookies, supabaseToken, userId: supabaseToken.sub ?? 'anon' };
});

/**
 * Creates a deduplicated public API query function using React.cache.
 *
 * The API function does not depend on user authentication and can be safely cached with 'use cache'.
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function
 */
const createPublicApiQuery = <I = void, O = void>(
  apiQueryFn: (opts: { input: I }) => Promise<O>,
): ((input: I) => Promise<O>) => {
  return cache(async (input) => {
    return apiQueryFn({ input });
  });
};
/**
 * Creates a deduplicated API query function using React.cache.
 * The generated function provides access to the AuthenticatedApiQueryContext, which includes cookies.
 *
 * As long as the context is serializable, the API function can be safely cached with 'use cache'.
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function
 */
const createAuthenticatedApiQuery = <I = void, O = void>(
  apiQueryFn: (opts: { input: I; ctx: AuthenticatedApiQueryContext }) => Promise<O>,
): ((input: I) => Promise<O>) => {
  return cache(async (input) => {
    const ctx = await createAuthenticatedContext();
    return apiQueryFn({ input, ctx });
  });
};

export { createPublicApiQuery, createAuthenticatedApiQuery };
