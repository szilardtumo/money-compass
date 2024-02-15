'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { createSimpleAccount } from '@/lib/db/accounts';
import { Currency } from '@/lib/types/currencies.types';
import { ActionErrorCode } from '@/lib/types/transport.types';
import { createToastPromise } from '@/lib/utils/toasts';

interface CreateAccountFormProps {
  currencies: Currency[];
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Account name must be at least 2 characters.' })
    .max(50, { message: 'Account name must be at most 50 characters.' }),
  currency: z.string({ required_error: 'A currency must be selected.' }),
});

type FormFields = z.infer<typeof formSchema>;

export function CreateAccountForm({ currencies, onSuccess }: CreateAccountFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      currency: undefined,
    },
  });

  async function onSubmit(values: FormFields) {
    const promise = createSimpleAccount(values);

    toast.promise(createToastPromise(promise), {
      loading: 'Creating account...',
      success: 'Account created!',
      error: (error) =>
        error.code === ActionErrorCode.UniqueViolation
          ? 'An account with this name already exists.'
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
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Combobox
                  options={currencyOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    form.setValue(field.name, value as FormFields['currency'], {
                      shouldValidate: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="self-stretch sm:self-end">
          Add
        </Button>
      </form>
    </Form>
  );
}
