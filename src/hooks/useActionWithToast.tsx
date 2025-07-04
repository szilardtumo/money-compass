/* eslint-disable @typescript-eslint/no-explicit-any */
import { HookProps, useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Infer, InferIn, Schema } from 'next-safe-action/adapters/types';
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
import { Resolver } from 'react-hook-form';
import { ExternalToast, toast } from 'sonner';

type ToastTitle = string | React.ReactNode;
type ToastConfig = ToastTitle | (ExternalToast & { title: ToastTitle });

type ToastUtils<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
> = {
  loadingToast?:
    | ToastConfig
    | ((
        ...args: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onExecute']>
        >
      ) => ToastConfig);
  errorToast?:
    | ToastConfig
    | ((
        params: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onError']>
        >[0] & { errorMessage: string },
      ) => ToastConfig)
    | false;
  successToast?:
    | ToastConfig
    | ((
        ...args: Parameters<
          NonNullable<HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>['onSuccess']>
        >
      ) => ToastConfig);
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
        const config =
          typeof utils.loadingToast === 'function' ? utils.loadingToast(args) : utils.loadingToast;
        const { title, ...data } =
          typeof config === 'object' && config !== null && 'title' in config
            ? config
            : { title: config };
        toast.loading(title, { description: '', ...data, id });
      }
    },
    onError: (args) => {
      utils?.onError?.(args);

      // @ts-expect-error _errors might exist in case of global validation errors
      const { _errors: formErrors, ...fieldErrors } = args.error.validationErrors ?? {};

      const validationErrorMessage = [
        ...(formErrors ?? []),
        ...Object.entries(fieldErrors).map(
          ([path, error]) =>
            `${(error as { _errors?: string[] })._errors?.join(', ') ?? ''} at ${path}`,
        ),
      ].join('; ');

      const errorMessage = String(
        validationErrorMessage || args.error.serverError || 'An unknown error occurred',
      );

      if (utils?.errorToast !== false) {
        const config =
          typeof utils?.errorToast === 'function'
            ? utils.errorToast({ ...args, errorMessage })
            : utils?.errorToast;
        const { title = errorMessage, ...data } =
          typeof config === 'object' && config !== null && 'title' in config
            ? config
            : { title: config };
        toast.error(title, { ...data, id });
      } else {
        toast.dismiss(id);
      }
    },
    onSuccess: (args) => {
      utils?.onSuccess?.(args);

      if (utils?.successToast) {
        const config =
          typeof utils.successToast === 'function' ? utils.successToast(args) : utils.successToast;
        const { title, ...data } =
          typeof config === 'object' && config !== null && 'title' in config
            ? config
            : { title: config };
        toast.success(title, { ...data, id });
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

export const useHookFormActionWithToast = <
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  FormContext = any,
>(
  safeActionFn: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
  hookFormResolver: Resolver<S extends Schema ? Infer<S> : any, FormContext>,
  props?: HookProps<ServerError, S, BAS, CVE, CBAVE, Data, FormContext> & {
    actionProps: HookBaseUtils<S> &
      HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data> &
      ToastUtils<ServerError, S, BAS, CVE, CBAVE, Data>;
  },
) => {
  const id = useId();

  return useHookFormAction(safeActionFn, hookFormResolver, {
    ...props,
    actionProps: {
      ...props?.actionProps,
      ...getCallbacksWithToast(id, props?.actionProps),
    },
  });
};
