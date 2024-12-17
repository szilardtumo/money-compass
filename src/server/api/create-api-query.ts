import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { getSupabaseToken, SupabaseToken } from '@/lib/supabase/server';

interface ApiQueryContext {
  plainCookies: RequestCookie[];
  supabaseToken: SupabaseToken;
  userId: string;
}

/**
 * Creates a context object which will be accessible from all API queries.
 *
 * The context returned by this function needs to be serializable to enable caching of API queries using 'use cache'.
 *
 * @returns The context object
 */
const createContext = cache(async (): Promise<ApiQueryContext> => {
  const plainCookies = (await cookies()).getAll();
  const supabaseToken = await getSupabaseToken();

  return { plainCookies, supabaseToken, userId: supabaseToken.sub ?? 'anon' };
});

/**
 * Creates a deduplicated API query function using React.cache.
 * The generated function provides access to the ApiQueryContext, which includes cookies.
 *
 * As long as the context is serializable, the API function can be safely cached with 'use cache'.
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function
 */
const createApiQuery = <I = void, O = void>(
  apiQueryFn: (opts: { input: I; ctx: ApiQueryContext }) => Promise<O>,
): ((input: I) => Promise<O>) => {
  return cache(async (input) => {
    const ctx = await createContext();
    return apiQueryFn({ input, ctx });
  });
};

export { createApiQuery };
