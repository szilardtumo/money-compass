'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isFuture } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { updateTransactionSchema } from '@/lib/validation/transactions';
import { apiActions } from '@/server/api/actions';

type FormFields = z.infer<typeof updateTransactionSchema>;

interface UpdateTransactionFormProps {
  currency: string;
  defaultValues: FormFields;
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

export function UpdateTransactionForm({
  currency,
  defaultValues,
  onSuccess,
}: UpdateTransactionFormProps) {
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.transactions.updateTransaction,
    zodResolver(updateTransactionSchema),
    {
      actionProps: {
        loadingToast: 'Updating transaction...',
        successToast: 'Transaction updated!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to update transaction',
          description: errorMessage,
        }),
        onSuccess,
      },
      formProps: {
        defaultValues,
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
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
                <CurrencyInput currency={currency} {...field} />
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
          Update
        </Button>
      </form>
    </Form>
  );
}
