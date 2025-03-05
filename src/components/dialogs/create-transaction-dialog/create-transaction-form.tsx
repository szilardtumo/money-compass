'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isFuture, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Account } from '@/lib/types/accounts.types';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface CreateTransactionFormProps {
  accounts: Account[];
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
] satisfies { label: string; value: string }[];

const formSchema = z.object({
  account: z.string({ required_error: 'An account must be selected.' }),
  subaccount: z.string({ required_error: 'A subaccount must be selected.' }),
  type: z.string({ required_error: 'A transaction type must be selected.' }),
  amount: z.number(),
  description: z.string().min(1, 'Description is required.'),
  date: z.date().max(new Date(), 'Date cannot be in the future.'),
});

type FormFields = z.infer<typeof formSchema>;

export function CreateTransactionForm({
  accounts,
  defaultValues,
  onSuccess,
}: CreateTransactionFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, description: '', date: startOfDay(new Date()), ...defaultValues },
  });

  const selectedAccountId = form.watch('account');
  const selectedSubaccountId = form.watch('subaccount');
  const selectedSubaccountCurrency = useMemo(
    () =>
      accounts
        .find((account) => account.id === selectedAccountId)
        ?.subaccounts.find((subaccount) => subaccount.id === selectedSubaccountId)
        ?.originalCurrency,
    [accounts, selectedAccountId, selectedSubaccountId],
  );

  async function onSubmit(values: FormFields) {
    const promise = apiActions.transactions.createTransaction({
      amount: values.amount,
      type: values.type,
      subaccountId: selectedSubaccountId,
      description: values.description,
      date: values.date,
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

  const subaccountOptions = useMemo(() => {
    return (
      accounts
        .find((account) => account.id === selectedAccountId)
        ?.subaccounts.map((subaccount) => ({
          label: subaccount.name,
          value: subaccount.id,
        })) ?? []
    );
  }, [accounts, selectedAccountId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="account"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Combobox options={accountOptions} onValueChange={onChange} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subaccount"
          disabled={!selectedAccountId}
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Subaccount</FormLabel>
              <FormControl>
                <Combobox options={subaccountOptions} onValueChange={onChange} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Transaction type</FormLabel>
              <FormControl>
                <Selectbox options={transactionTypeOptions} onValueChange={onChange} {...field} />
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
                <CurrencyInput currency={selectedSubaccountCurrency} {...field} />
              </FormControl>
              <FormDescription>
                The transaction value. Positive value means income, negative means expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>This will be seen in the transaction history.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker disabled={isFuture} onValueChange={onChange} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Add
        </Button>
      </form>
    </Form>
  );
}
