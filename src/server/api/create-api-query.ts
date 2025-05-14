import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { AuthenticationError } from '@/lib/errors';
import { getSupabaseToken, SupabaseToken } from '@/lib/supabase/server';

interface AuthenticatedApiQueryContext {
  plainCookies: RequestCookie[];
  supabaseToken: SupabaseToken;
  userId: string;
}

type ApiQueryFunction<I = void, O = void, C = undefined> = (opts: {
  input: I;
  ctx: C;
}) => Promise<O>;

/**
 * Creates a context object which will be accessible from all authenticated API queries.
 *
 * The context returned by this function needs to be serializable to enable caching of API queries using 'use cache'.
 *
 * @returns The context object
 */
// TODO: move to separate file, create separate serializable context and full context
export const createAuthenticatedContext = cache(async (): Promise<AuthenticatedApiQueryContext> => {
  const plainCookies = (await cookies()).getAll();
  const supabaseToken = await getSupabaseToken();

  return { plainCookies, supabaseToken, userId: supabaseToken.sub ?? 'anon' };
});

const withErrorHandling = <I = void, O = void, C = undefined>(
  apiQueryFn: ApiQueryFunction<I, O, C>,
): ApiQueryFunction<I, O, C> => {
  return async (opts) => {
    try {
      return await apiQueryFn(opts);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Redirect to the login page if the user is not authenticated
        redirect('/auth/login');

        // Early return to avoid processing the error further
        return undefined as O;
      }

      // Log all errors at the middleware level
      console.error(`API query error:`, error);

      if (error instanceof Error) {
        error.message = `API Error: ${error.message}`;
      }

      throw error;
    }
  };
};

/**
 * Creates a deduplicated public API query function using React.cache.
 *
 * The API function does not depend on user authentication and can be safely cached with 'use cache'.
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function
 */
const createPublicApiQuery = <I = void, O = void>(
  apiQueryFn: ApiQueryFunction<I, O>,
): ((input: I) => Promise<O>) => {
  const apiQueryFnWithMiddleware = withErrorHandling(apiQueryFn);
  return cache(async (input) => {
    return apiQueryFnWithMiddleware({ input, ctx: undefined });
  });
};

interface AuthenticatedApiQuery<I, O> {
  (input: I): Promise<O>;

  /**
   * Directly calls the API query function with the provided context.
   *
   * Useful when calling the API query inside a function cached with 'use cache'.
   *
   * @param opts The options object containing the input and context
   * @returns The result of the API query function
   */
  withContext: (
    opts: I extends void
      ? { input?: I; ctx: AuthenticatedApiQueryContext }
      : { input: I; ctx: AuthenticatedApiQueryContext },
  ) => Promise<O>;
}

/**
 * Creates a deduplicated API query function using React.cache.
 * The generated function provides access to the AuthenticatedApiQueryContext, which includes cookies.
 *
 * As long as the context is serializable, the API function can be safely cached with 'use cache'.
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function with a 'withContext' method for direct context access
 */
const createAuthenticatedApiQuery = <I = void, O = void>(
  apiQueryFn: ApiQueryFunction<I, O, AuthenticatedApiQueryContext>,
) => {
  const apiQueryFnWithMiddleware = withErrorHandling(apiQueryFn);
  const fn = cache(async (input: I) => {
    const ctx = await createAuthenticatedContext();
    return apiQueryFnWithMiddleware({ input, ctx });
  }) as AuthenticatedApiQuery<I, O>;

  fn.withContext = cache(apiQueryFn) as typeof fn.withContext;

  return fn;
};

export { createPublicApiQuery, createAuthenticatedApiQuery };
