import 'server-only';

import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

import { createFullApiContext } from './context';

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
  const ctx = await createFullApiContext();

  if (!ctx.userId) {
    throw new Error('User not authenticated');
  }

  return next({ ctx });
});
