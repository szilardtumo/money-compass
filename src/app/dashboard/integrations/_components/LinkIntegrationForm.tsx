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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Account } from '@/lib/types/accounts.types';
import { Integration } from '@/lib/types/integrations.types';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

import { LinkVisualization } from './LinkVisualization';

interface LinkIntegrationFormProps {
  accounts: Account[];
  integration: Integration;
  integrationAccountId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  subaccountId: z.string(),
});

type FormFields = z.infer<typeof formSchema>;

export function LinkIntegrationForm({
  accounts,
  integration,
  integrationAccountId,
  onSuccess,
}: LinkIntegrationFormProps) {
  const integrationAccount = useMemo(
    () => integration.accounts.find((account) => account.id === integrationAccountId)!,
    [integration, integrationAccountId],
  );

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subaccountId: '',
    },
  });

  async function onSubmit({ subaccountId }: FormFields) {
    const promise = apiActions.integrations.linkIntegration({
      integrationId: integration.id,
      integrationAccountId,
      subaccountId,
    });

    toast.promise(createToastPromise(promise), {
      loading: 'Linking integration...',
      success: 'Integration linked! The transactions will now be synchronized.',
      error: (err) => `Failed to link integration! ${err.message}`,
    });

    const response = await promise;
    if (response.success) {
      onSuccess();
    }
  }

  const subaccountOptions = useMemo(() => {
    return accounts
      .flatMap((account) =>
        account.subaccounts.map((subaccount) => ({
          ...subaccount,
          name: `${subaccount.name} (${account.name})`,
        })),
      )
      .filter((subaccount) => subaccount.originalCurrency === integrationAccount?.currency)
      .map((subaccount) => ({
        label: subaccount.name,
        value: subaccount.id,
      }));
  }, [integrationAccount?.currency, accounts]);

  const selectedSubaccountId = form.watch('subaccountId');

  const visualizationProps = useMemo(() => {
    const selectedAccount = accounts.find((account) =>
      account.subaccounts.some((subaccount) => subaccount.id === selectedSubaccountId),
    );
    const selectedSubccount = selectedAccount?.subaccounts.find(
      (subaccount) => subaccount.id === selectedSubaccountId,
    );

    const from = {
      accountName: integration.institution.name,
      subaccountName: integrationAccount.name || integrationAccount.iban,
      currency: integrationAccount.currency,
      logoUrl: integration.institution.logoUrl,
    };

    const to =
      selectedAccount && selectedSubccount
        ? {
            accountName: selectedAccount.name,
            subaccountName: selectedSubccount.name,
            currency: selectedSubccount.originalCurrency,
          }
        : undefined;

    return { from, to };
  }, [accounts, integration, integrationAccount, selectedSubaccountId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="subaccountId"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Subaccount</FormLabel>
              <FormControl>
                <Combobox
                  placeholder="Select subaccount to link"
                  options={subaccountOptions}
                  onValueChange={onChange}
                  notFoundMessage="No subaccounts found with the same currency as the integration account."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LinkVisualization {...visualizationProps} />

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Link
        </Button>
      </form>
    </Form>
  );
}
