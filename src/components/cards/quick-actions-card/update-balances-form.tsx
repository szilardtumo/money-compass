'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isFuture, startOfDay } from 'date-fns';

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
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { formatCurrency } from '@/lib/utils/formatters';
import { updateBalancesSchema } from '@/lib/validation/transactions';
import { apiActions } from '@/server/api/actions';

interface UpdateBalancesFormProps {
  accounts: Account[];
  onSuccess?: () => void;
}

export function UpdateBalancesForm({ accounts, onSuccess }: UpdateBalancesFormProps) {
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.transactions.updateBalances,
    zodResolver(updateBalancesSchema),
    {
      actionProps: {
        loadingToast: 'Updating account balances...',
        successToast: 'Account balances updated!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to update account balances',
          description: errorMessage,
        }),
        onSuccess,
      },
      formProps: {
        defaultValues: {
          description: 'Manual balance correction',
          date: startOfDay(new Date()),
          balances: Object.fromEntries(
            accounts.flatMap((account) =>
              account.subaccounts.map((subaccount) => [
                subaccount.id,
                subaccount.balance.originalValue,
              ]),
            ),
          ),
        },
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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

                        <FormDescription className="col-start-2 mt-1!">
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
          isLoading={form.formState.isSubmitting}
          className="self-stretch sm:self-end"
        >
          Update
        </Button>
      </form>
    </Form>
  );
}
