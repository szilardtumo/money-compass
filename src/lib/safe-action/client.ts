import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

import { createAuthenticatedContext } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';

export const actionClient = createSafeActionClient({
  defaultValidationErrorsShape: 'flattened',
  handleServerError: (error, _utils) => {
    console.error('Action error:', error.message);

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const result = await next();

  if (result.validationErrors) {
    result.validationErrors = [
      ...(result.validationErrors.formErrors ?? []).join('; '),
      ...Object.entries(result.validationErrors.fieldErrors ?? {}).map(
        ([path, errors]) => `${(errors as string[]).join(', ')} at ${path}`,
      ),
    ].join('; ');
  }

  return result;
});

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const queryCtx = await createAuthenticatedContext();

  if (!queryCtx.userId) {
    throw new Error('User not authenticated');
  }

  const ctx = {
    ...queryCtx,
    db: await getDb(queryCtx.supabaseToken),
  };

  return next({ ctx });
});
