/* eslint-disable @typescript-eslint/no-explicit-any */
import { HookProps, useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
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

/** Infer the input type of a Standard Schema, or a default type if the schema is undefined. */
type InferInputOrDefault<MaybeSchema, Default> = MaybeSchema extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<MaybeSchema>
  : Default;
/** Infer the output type of a Standard Schema, or a default type if the schema is undefined. */
type InferOutputOrDefault<MaybeSchema, Default> = MaybeSchema extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<MaybeSchema>
  : Default;

type ToastTitle = string | React.ReactNode;
type ToastConfig = ToastTitle | (ExternalToast & { title: ToastTitle });

type ToastUtils<ServerError, S extends StandardSchemaV1 | undefined, CVE, Data> = {
  loadingToast?:
    | ToastConfig
    | ((
        ...args: Parameters<NonNullable<HookCallbacks<ServerError, S, CVE, Data>['onExecute']>>
      ) => ToastConfig);
  errorToast?:
    | ToastConfig
    | ((
        params: Parameters<NonNullable<HookCallbacks<ServerError, S, CVE, Data>['onError']>>[0] & {
          errorMessage: string;
        },
      ) => ToastConfig)
    | false;
  successToast?:
    | ToastConfig
    | ((
        ...args: Parameters<NonNullable<HookCallbacks<ServerError, S, CVE, Data>['onSuccess']>>
      ) => ToastConfig);
};

type UseActionWithToast = <ServerError, S extends StandardSchemaV1 | undefined, CVE, Data>(
  safeActionFn: HookSafeActionFn<ServerError, S, CVE, Data>,
  cb?: HookCallbacks<ServerError, S, CVE, Data> & ToastUtils<ServerError, S, CVE, Data>,
) => UseActionHookReturn<ServerError, S, CVE, Data>;

type UseOptimisticActionWithToast = <
  ServerError,
  S extends StandardSchemaV1 | undefined,
  CVE,
  Data,
  State,
>(
  safeActionFn: HookSafeActionFn<ServerError, S, CVE, Data>,
  utils: {
    currentState: State;
    updateFn: (state: State, input: InferInputOrDefault<S, void>) => State;
  } & HookCallbacks<ServerError, S, CVE, Data> &
    ToastUtils<ServerError, S, CVE, Data>,
) => UseOptimisticActionHookReturn<ServerError, S, CVE, Data, State>;

const getCallbacksWithToast = <ServerError, S extends StandardSchemaV1 | undefined, CVE, Data>(
  id: number | string,
  utils?: HookCallbacks<ServerError, S, CVE, Data> & ToastUtils<ServerError, S, CVE, Data>,
): HookCallbacks<ServerError, S, CVE, Data> => {
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
  S extends StandardSchemaV1 | undefined,
  CVE,
  Data,
  FormContext = any,
>(
  safeActionFn: HookSafeActionFn<ServerError, S, CVE, Data>,
  hookFormResolver: Resolver<
    InferInputOrDefault<S, any>,
    FormContext,
    InferOutputOrDefault<S, any>
  >,
  props?: HookProps<ServerError, S, CVE, Data, FormContext> & {
    actionProps: HookCallbacks<ServerError, S, CVE, Data> & ToastUtils<ServerError, S, CVE, Data>;
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
