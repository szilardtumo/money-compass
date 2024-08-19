'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { Selectbox } from '@/components/ui/selectbox';
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
        id: z.string(),
        name: z.string(),
        originalCurrency: z.string({ required_error: 'A currency must be selected.' }),
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
        {/* <FormField
          control={form.control}
          name="originalCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
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
        /> */}
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
