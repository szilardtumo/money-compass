import 'server-only';

import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

import { AuthenticationError } from '@/lib/api/errors';

import { createFullApiContext } from './context';

export const actionClient = createSafeActionClient({
  handleServerError: (error, _utils) => {
    console.error('Action error:', error.message);

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const result = await next();

  // Additional error handling?

  return result;
});

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const ctx = await createFullApiContext();

  if (!ctx.userId) {
    throw new AuthenticationError('User not authenticated');
  }

  return next({ ctx });
});
