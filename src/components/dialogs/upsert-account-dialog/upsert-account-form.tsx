'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Cross1Icon, PlusIcon, ReloadIcon, ResetIcon } from '@radix-ui/react-icons';
import { useCallback, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Currency } from '@/lib/types/currencies.types';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode } from '@/lib/types/transport.types';
import { createToastPromise } from '@/lib/utils/toasts';
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

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, { message: 'Account name must be at least 2 characters.' })
    .max(50, { message: 'Account name must be at most 50 characters.' }),
  category: z.enum(['checking', 'investment'], {
    required_error: 'An account category must be selected.',
  }),
  subaccounts: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, 'Subaccount name is required'),
        originalCurrency: z.string().min(1, 'A currency must be selected.'),
        delete: z.literal(true).optional(),
      }),
    )
    .optional(),
});

type FormFields = z.infer<typeof formSchema>;

export function UpsertAccountForm({
  currencies,
  defaultValues,
  onSuccess,
}: UpsertAccountFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
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

  const onRemoveSubaccount = useCallback(
    (index: number) => {
      const subaccount = getValues().subaccounts![index];
      if (subaccount.id) {
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

  async function onSubmit({ id, ...values }: FormFields) {
    const isUpdate = !!id;

    const promise = isUpdate
      ? apiActions.accounts.updateAccount(id, values)
      : apiActions.accounts.createAccount(values);

    toast.promise(createToastPromise(promise), {
      loading: isUpdate ? 'Updating account...' : 'Creating account...',
      success: isUpdate ? 'Account updated!' : 'Account created!',
      error: (error) =>
        error?.code === ActionErrorCode.UniqueViolation
          ? 'An account with this name already exists.'
          : isUpdate
            ? 'Failed to update account.'
            : 'Failed to create account.',
    });

    const response = await promise;
    if (response.success) {
      onSuccess?.();
    }
  }

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
            onClick={() => subaccountFieldArray.append({ name: '', originalCurrency: '' })}
            disabled={form.formState.isSubmitting}
          >
            <PlusIcon className="mr-2" />
            Add more
          </Button>
        </div>

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
    </Form>
  );
}
