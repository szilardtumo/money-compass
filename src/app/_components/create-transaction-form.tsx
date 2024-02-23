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
import { createTransaction } from '@/lib/db/transactions';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { Enums } from '@/lib/types/database.types';
import { createToastPromise } from '@/lib/utils/toasts';

interface CreateTransactionFormProps {
  accounts: SimpleAccount[];
  defaultValues?: Partial<FormFields>;
  onSuccess?: () => void;
}

const transactionTypeOptions = [
  { label: 'Card payment', value: 'card_payment' },
  { label: 'Other', value: 'other' },
  { label: 'Correction', value: 'correction' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Exchange', value: 'exchange' },
  { label: 'Top-up', value: 'topup' },
] satisfies { label: string; value: Enums<'transaction_type'> }[];

const formSchema = z.object({
  account: z.string({ required_error: 'An account must be selected.' }),
  type: z.string({ required_error: 'A transaction type must be selected.' }),
  amount: z.number(),
});

type FormFields = z.infer<typeof formSchema>;

export function CreateTransactionForm({
  accounts,
  defaultValues,
  onSuccess,
}: CreateTransactionFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, ...defaultValues },
  });

  async function onSubmit(values: FormFields) {
    const subaccountId = accounts.find((account) => account.id === values.account)?.subaccountId;

    if (!subaccountId) {
      form.setError('account', { message: 'Select a valid account.' });
    }

    const promise = createTransaction({
      amount: values.amount,
      type: values.type as Enums<'transaction_type'>,
      subaccountId: subaccountId!,
    });

    toast.promise(createToastPromise(promise), {
      loading: 'Adding transaction...',
      success: 'Transaction added!',
      error: () => 'Failed to add transaction.',
    });

    const response = await promise;
    if (response.success) {
      onSuccess?.();
    }
  }

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      label: account.name,
      value: account.id,
    }));
  }, [accounts]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="account"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Combobox
                  options={accountOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction type</FormLabel>
              <FormControl>
                <Selectbox
                  options={transactionTypeOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                The transaction value. Positive value means income, negative means expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Add
        </Button>
      </form>
    </Form>
  );
}
