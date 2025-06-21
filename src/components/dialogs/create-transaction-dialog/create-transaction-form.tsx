'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isFuture, startOfDay } from 'date-fns';
import { useMemo } from 'react';
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
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { createTransactionSchema } from '@/lib/validation/transactions';
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

type FormFields = z.infer<typeof createTransactionSchema>;

export function CreateTransactionForm({
  accounts,
  defaultValues,
  onSuccess,
}: CreateTransactionFormProps) {
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.transactions.createTransaction,
    zodResolver(createTransactionSchema),
    {
      actionProps: {
        loadingToast: 'Adding transaction...',
        successToast: 'Transaction added!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to add transaction',
          description: errorMessage,
        }),
        onSuccess,
      },
      formProps: {
        defaultValues: {
          amount: 0,
          description: '',
          date: startOfDay(new Date()),
          ...defaultValues,
        },
      },
    },
  );

  const selectedAccountId = form.watch('accountId');
  const selectedSubaccountId = form.watch('subaccountId');
  const selectedSubaccountCurrency = useMemo(
    () =>
      accounts
        .find((account) => account.id === selectedAccountId)
        ?.subaccounts.find((subaccount) => subaccount.id === selectedSubaccountId)
        ?.originalCurrency,
    [accounts, selectedAccountId, selectedSubaccountId],
  );

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
      <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="accountId"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Combobox
                  options={accountOptions}
                  onValueChange={(value) => {
                    onChange(value);
                    form.resetField('subaccountId');
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subaccountId"
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
