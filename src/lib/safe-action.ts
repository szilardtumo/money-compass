import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

export const actionClient = createSafeActionClient({
  defaultValidationErrorsShape: 'flattened',
  handleServerError: (error, _utils) => {
    // eslint-disable-next-line no-console
    console.error('Action error:', error.message);

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const result = await next();

  if (result.validationErrors) {
    result.validationErrors.messages = [
      ...(result.validationErrors.formErrors ?? []),
      // TODO: define more user-friendly validation error messages (https://github.com/causaly/zod-validation-error)
      ...Object.values(result.validationErrors.fieldErrors ?? {}).flat(),
    ];
  }

  return result;
});
