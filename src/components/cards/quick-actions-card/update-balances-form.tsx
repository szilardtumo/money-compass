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
import { updateAccountBalances } from '@/lib/db/accounts.actions';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';
import { createToastPromise } from '@/lib/utils/toasts';

interface UpdateBalancesFormProps {
  accounts: SimpleAccount[];
  onSuccess?: () => void;
}

export function UpdateBalancesForm({ accounts, onSuccess }: UpdateBalancesFormProps) {
  const formSchema = z.object({
    balances: z.record(z.number()),
  });

  type FormFields = z.infer<typeof formSchema>;

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balances: Object.fromEntries(
        accounts.map((account) => [account.subaccountId, account.balance.originalValue]),
      ),
    },
  });

  async function onSubmit(values: FormFields) {
    const promise = updateAccountBalances(values.balances);

    toast.promise(createToastPromise(promise), {
      loading: 'Updating account balances...',
      success: 'Account balances updated!',
      error: () => 'Failed to update account balances.',
    });

    const response = await promise;
    if (response.success) {
      onSuccess?.();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        {accounts.map((account) => (
          <FormField
            key={account.subaccountId}
            control={form.control}
            name={`balances.${account.subaccountId}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{account.name}</FormLabel>
                <FormControl>
                  <CurrencyInput currency={account.originalCurrency} {...field} />
                </FormControl>
                <FormDescription>
                  Previous balance:{' '}
                  {formatCurrency(account.balance.originalValue, account.originalCurrency)}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="self-stretch sm:self-end"
        >
          {form.formState.isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Update
        </Button>
      </form>
    </Form>
  );
}
