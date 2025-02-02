import { InferIn, Schema } from 'next-safe-action/adapters/types';
import {
  HookBaseUtils,
  HookCallbacks,
  HookSafeActionFn,
  useAction,
  UseActionHookReturn,
  useOptimisticAction,
  UseOptimisticActionHookReturn,
} from 'next-safe-action/hooks';
import { useId } from 'react';
import { toast } from 'sonner';

type ToastMessage = string | React.ReactNode;

type ToastUtils<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  loadingToast?:
    | ToastMessage
    | ((
        ...args: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onExecute']>
        >
      ) => ToastMessage);
  errorToast?:
    | ToastMessage
    | ((
        ...args: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onError']>
        >
      ) => ToastMessage)
    | false;
  successToast?:
    | ToastMessage
    | ((
        ...args: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onSuccess']>
        >
      ) => ToastMessage);
};

type UseActionWithToast = <
  ServerError,
  S extends Schema | undefined,
  const BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
>(
  safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
  utils?: HookBaseUtils<S> &
    HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data> &
    ToastUtils<ServerError, S, BAS, CVE, CBAVE, Data>,
) => UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>;

type UseOptimisticActionWithToast = <
  ServerError,
  S extends Schema | undefined,
  const BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  State,
>(
  safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
  utils: {
    currentState: State;
    updateFn: (state: State, input: S extends Schema ? InferIn<S> : undefined) => State;
  } & HookBaseUtils<S> &
    HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data> &
    ToastUtils<ServerError, S, BAS, CVE, CBAVE, Data>,
) => UseOptimisticActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data, State>;

const getCallbacksWithToast = <
  ServerError,
  S extends Schema | undefined,
  const BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
>(
  id: number | string,
  utils?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data> &
    ToastUtils<ServerError, S, BAS, CVE, CBAVE, Data>,
): HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data> => {
  return {
    onExecute: (args) => {
      utils?.onExecute?.(args);
      if (utils?.loadingToast) {
        toast.loading(
          typeof utils.loadingToast === 'function' ? utils.loadingToast(args) : utils.loadingToast,
          { id },
        );
      }
    },
    onError: (args) => {
      utils?.onError?.(args);

      // @ts-expect-error messages is defined in a middleware, see safe-action.ts
      const validationError = args.error.validationErrors?.messages?.join(', ');

      if (utils?.errorToast !== false) {
        toast.error(
          typeof utils?.errorToast === 'function'
            ? utils.errorToast(args)
            : (utils?.errorToast ?? validationError ?? args.error.serverError),
          { id },
        );
      } else {
        toast.dismiss(id);
      }
    },
    onSuccess: (args) => {
      utils?.onSuccess?.(args);

      if (utils?.successToast) {
        toast.success(
          typeof utils.successToast === 'function' ? utils.successToast(args) : utils.successToast,
          { id },
        );
      } else {
        toast.dismiss(id);
      }
    },
  };
};

export const useActionWithToast: UseActionWithToast = (safeActionFn, utils) => {
  const id = useId();

  return useAction(safeActionFn, {
    ...utils,
    ...getCallbacksWithToast(id, utils),
  });
};

export const useOptimisticActionWithToast: UseOptimisticActionWithToast = (safeActionFn, utils) => {
  const id = useId();

  return useOptimisticAction(safeActionFn, {
    ...utils,
    ...getCallbacksWithToast(id, utils),
  });
};
