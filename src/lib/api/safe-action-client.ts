import 'server-only';

import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

import { createApiContext } from './context';
import { UserError } from './errors';

export const actionClient = createSafeActionClient({
  handleServerError: (error, _utils) => {
    console.error('Action error:', error.message);

    return error instanceof UserError ? error.message : DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const result = await next();

  // Additional error handling?

  return result;
});

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  // Throws AuthenticationError if the request has no valid session
  const ctx = await createApiContext();

  return next({ ctx });
});
