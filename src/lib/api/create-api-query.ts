import 'server-only';

import { redirect, unstable_rethrow } from 'next/navigation';
import { cache } from 'react';

import { getSerializableApiContext, SerializableApiContext } from '@/lib/api/context';
import { AuthenticationError } from '@/lib/api/errors';

type ApiQueryFunction<I = void, O = void, C = undefined> = (opts: {
  input: I;
  ctx: C;
}) => Promise<O>;

const withErrorHandling = async <O>(query: () => Promise<O>): Promise<O> => {
  try {
    return await query();
  } catch (error) {
    // Let Next.js handle its own errors (redirect, notFound, prerendering bailouts)
    unstable_rethrow(error);

    if (error instanceof AuthenticationError) {
      // Redirect to the login page if the user is not authenticated
      redirect('/auth/login');
    }

    // Log all errors at the middleware level
    console.error(`API query error:`, error);

    if (error instanceof Error) {
      error.message = `API Error: ${error.message}`;
    }

    throw error;
  }
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
  return cache((input) => withErrorHandling(() => apiQueryFn({ input, ctx: undefined })));
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
      ? { input?: I; ctx: SerializableApiContext }
      : { input: I; ctx: SerializableApiContext },
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
// The Supabase session read checks the token expiry against the current time, which a plain
// render can't do while Next.js prerenders the App Shell. A private cache scope can.
async function getQueryApiContext() {
  'use cache: private';
  return getSerializableApiContext();
}

const createAuthenticatedApiQuery = <I = void, O = void>(
  apiQueryFn: ApiQueryFunction<I, O, SerializableApiContext>,
) => {
  const fn = cache((input: I) =>
    withErrorHandling(async () => {
      const ctx = await getQueryApiContext();
      if (!ctx) {
        throw new AuthenticationError('User not authenticated');
      }
      return apiQueryFn({ input, ctx });
    }),
  ) as AuthenticatedApiQuery<I, O>;

  fn.withContext = cache(apiQueryFn) as typeof fn.withContext;

  return fn;
};

export { createAuthenticatedApiQuery, createPublicApiQuery };
