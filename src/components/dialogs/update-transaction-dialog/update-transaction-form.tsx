'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { updateTransaction } from '@/lib/db/transactions.actions';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { Enums } from '@/lib/types/database.types';
import { createToastPromise } from '@/lib/utils/toasts';

interface UpdateTransactionFormProps {
  account: SimpleAccount;
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
] satisfies { label: string; value: Enums<'transaction_type'> }[];

const formSchema = z.object({
  id: z.string().uuid(),
  type: z.string({ required_error: 'A transaction type must be selected.' }),
  amount: z.number(),
  description: z.string().min(1, 'Description is required.'),
});

type FormFields = z.infer<typeof formSchema>;

export function UpdateTransactionForm({
  account,
  defaultValues,
  onSuccess,
}: UpdateTransactionFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(values: FormFields) {
    const promise = updateTransaction(values.id, {
      type: values.type as Enums<'transaction_type'>,
      amount: values.amount,
      description: values.description,
    });

    toast.promise(createToastPromise(promise), {
      loading: 'Updating transaction...',
      success: 'Transaction updated!',
      error: () => 'Failed to update transaction.',
    });

    const response = await promise;
    if (response.success) {
      onSuccess?.();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
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
                <CurrencyInput currency={account.currency} {...field} />
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

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Update
        </Button>
      </form>
    </Form>
  );
}
