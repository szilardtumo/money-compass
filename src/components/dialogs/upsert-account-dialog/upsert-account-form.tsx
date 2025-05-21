'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormActionErrorMapper } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Cross1Icon, PlusIcon, ResetIcon } from '@radix-ui/react-icons';
import { useCallback, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Selectbox } from '@/components/ui/selectbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Currency } from '@/lib/types/currencies.types';
import { Enums } from '@/lib/types/database.types';
import { createAccountSchema, updateAccountSchema } from '@/lib/validation/accounts';
import { apiActions } from '@/server/api/actions';

interface UpsertAccountFormProps {
  currencies: Currency[];
  defaultValues?: Partial<FormFields>;
  onSuccess?: () => void;
}

const accountCategoryOptions = [
  { label: 'Checking', value: 'checking' },
  { label: 'Investment', value: 'investment' },
] satisfies { label: string; value: Enums<'account_category'> }[];

type FormSchema = typeof updateAccountSchema | typeof createAccountSchema;
type FormFields = z.infer<FormSchema>;

export function UpsertAccountForm({
  currencies,
  defaultValues,
  onSuccess,
}: UpsertAccountFormProps) {
  const isUpdate = !!defaultValues && 'id' in defaultValues;

  const { execute: executeCreateAccount, result: createAccountResult } = useActionWithToast(
    apiActions.accounts.createAccount,
    {
      loadingToast: 'Creating account...',
      successToast: 'Account created!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to create account',
        description: errorMessage,
      }),
      onSuccess,
    },
  );

  const { execute: executeUpdateAccount, result: updateAccountResult } = useActionWithToast(
    apiActions.accounts.updateAccount,
    {
      loadingToast: 'Updating account...',
      successToast: 'Account updated!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to update account',
        description: errorMessage,
      }),
      onSuccess,
    },
  );
  const { hookFormValidationErrors } = useHookFormActionErrorMapper<FormSchema>(
    isUpdate ? updateAccountResult.validationErrors : createAccountResult.validationErrors,
  );

  const form = useForm<FormFields>({
    resolver: zodResolver(isUpdate ? updateAccountSchema : createAccountSchema),
    errors: hookFormValidationErrors,
    defaultValues: {
      name: '',
      ...defaultValues,
    },
  });

  const { getValues } = form;

  const subaccountFieldArray = useFieldArray({
    control: form.control,
    name: 'subaccounts',
    keyName: '_id', // Do not overwrite our own id
  });

  const onSubmit = useCallback(
    (fields: FormFields) => {
      const isUpdate = 'id' in fields;

      if (isUpdate) {
        executeUpdateAccount(fields);
      } else {
        executeCreateAccount(fields);
      }
    },
    [executeCreateAccount, executeUpdateAccount],
  );

  const onRemoveSubaccount = useCallback(
    (index: number) => {
      const subaccount = getValues().subaccounts![index];
      if ('id' in subaccount) {
        subaccountFieldArray.update(index, { ...subaccount, delete: true });
      } else {
        subaccountFieldArray.remove(index);
      }
    },
    [getValues, subaccountFieldArray],
  );

  const onReinstateSubaccount = useCallback(
    (index: number) => {
      const subaccount = getValues().subaccounts![index];
      subaccountFieldArray.update(index, {
        ...subaccount,
        delete: undefined,
      });
    },
    [getValues, subaccountFieldArray],
  );

  const currencyOptions = useMemo(() => {
    return currencies.map((currency) => ({
      label: currency.name,
      value: currency.id,
    }));
  }, [currencies]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="ex. Revolut" {...field} />
              </FormControl>
              <FormDescription>This will be displayed throughout the app.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Selectbox
                  options={accountCategoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Subaccounts</Label>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="w-[180px]">Currency</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!subaccountFieldArray.fields.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Click on the Add more button to add a subaccount.
                  </TableCell>
                </TableRow>
              )}
              {subaccountFieldArray.fields.map((subaccount, index) => (
                <TableRow key={subaccount._id} className="hover:bg-transparent">
                  <TableCell className="align-top">
                    <FormField
                      control={form.control}
                      name={`subaccounts.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} disabled={subaccount.delete} />
                          </FormControl>
                          {subaccount.delete && (
                            <FormDescription>This subaccount will be deleted.</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <FormField
                      control={form.control}
                      name={`subaccounts.${index}.originalCurrency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Combobox
                              options={currencyOptions}
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={subaccount.delete}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    {subaccount.delete ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onReinstateSubaccount(index)}
                        disabled={form.formState.isSubmitting}
                        aria-label="Reinstate subaccount"
                      >
                        <ResetIcon />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onRemoveSubaccount(index)}
                        disabled={form.formState.isSubmitting}
                        aria-label="Remove subaccount"
                      >
                        <Cross1Icon />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            type="button"
            className="self-start mx-4"
            icon={PlusIcon}
            onClick={() => subaccountFieldArray.append({ name: '', originalCurrency: '' })}
            disabled={form.formState.isSubmitting}
            isLoading={form.formState.isSubmitting}
          >
            Add more
          </Button>
        </div>

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
