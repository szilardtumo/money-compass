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
import { Account } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface UpdateBalancesFormProps {
  accounts: Account[];
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
        accounts.flatMap((account) =>
          account.subaccounts.map((subaccount) => [
            subaccount.id,
            subaccount.balance.originalValue,
          ]),
        ),
      ),
    },
  });

  async function onSubmit(values: FormFields) {
    const promise = apiActions.accounts.updateAccountBalances(values.balances);

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
        {accounts
          .filter((account) => account.subaccounts.length)
          .map((account) => (
            <div key={account.id} className="space-y-1">
              <h3 className="text-base font-semibold">{account.name}</h3>
              <div className="flex flex-col gap-3">
                {account.subaccounts.map((subaccount) => (
                  <FormField
                    key={subaccount.id}
                    control={form.control}
                    name={`balances.${subaccount.id}`}
                    render={({ field }) => (
                      <FormItem className="space-y-0 grid grid-cols-[12ch_1fr] gap-x-2 items-center">
                        <FormLabel className="line-clamp-2">{subaccount.name}</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            currency={subaccount.originalCurrency}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            {...field}
                          />
                        </FormControl>

                        <FormDescription className="col-start-2 !mt-1">
                          Previous balance:{' '}
                          {formatCurrency(
                            subaccount.balance.originalValue,
                            subaccount.originalCurrency,
                          )}
                        </FormDescription>
                        <FormMessage className="col-start-2" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
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
