import 'server-only';

import { redirect, unstable_rethrow } from 'next/navigation';
import { cache } from 'react';

import { AuthenticationError } from '@/lib/api/errors';

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
 * Creates a deduplicated API query function using React.cache.
 *
 * Queries for the current user's data start with 'use cache: private' and read the user from
 * createApiContext(). Next.js doesn't store private results on the server, but keeps them in
 * the browser's prefetched pages, so Server Actions purge those with revalidatePath().
 *
 * @param  apiQueryFn The function that performs the actual API query
 * @returns A deduplicated API query function
 */
const createApiQuery = <I = void, O = void>(
  apiQueryFn: (opts: { input: I }) => Promise<O>,
): ((input: I) => Promise<O>) => {
  return cache((input) => withErrorHandling(() => apiQueryFn({ input })));
};

export { createApiQuery };
