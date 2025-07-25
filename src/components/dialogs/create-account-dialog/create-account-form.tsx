'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Cross1Icon, PlusIcon } from '@radix-ui/react-icons';
import { useCallback, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
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
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Currency } from '@/lib/types/currencies.types';
import { Enums } from '@/lib/types/database.types';
import { createAccountSchema } from '@/lib/validation/accounts';
import { apiActions } from '@/server/api/actions';

interface CreateAccountFormProps {
  currencies: Currency[];
  defaultValues?: Partial<FormFields>;
  onSuccess?: () => void;
}

const accountCategoryOptions = [
  { label: 'Checking', value: 'checking' },
  { label: 'Investment', value: 'investment' },
] satisfies { label: string; value: Enums<'account_category'> }[];

type FormFields = z.infer<typeof createAccountSchema>;

export function CreateAccountForm({
  currencies,
  defaultValues,
  onSuccess,
}: CreateAccountFormProps) {
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.accounts.createAccount,
    zodResolver(createAccountSchema),
    {
      actionProps: {
        loadingToast: 'Creating account...',
        successToast: 'Account created!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to create account',
          description: errorMessage,
        }),
        onSuccess,
      },
      formProps: {
        defaultValues: {
          name: '',
          ...defaultValues,
        },
      },
    },
  );

  const subaccountFieldArray = useFieldArray({
    control: form.control,
    name: 'subaccounts',
    keyName: '_id', // Do not overwrite our own id
  });

  const onRemoveSubaccount = useCallback(
    (index: number) => {
      subaccountFieldArray.remove(index);
    },
    [subaccountFieldArray],
  );

  const currencyOptions = useMemo(() => {
    return currencies.map((currency) => ({
      label: currency.name,
      value: currency.id,
    }));
  }, [currencies]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
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
                            <Input {...field} />
                          </FormControl>
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="align-top">
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
