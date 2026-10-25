'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Institution } from '@/lib/types/integrations.types';
import { startIntegrationAuthSchema } from '@/lib/validation/integrations';
import { apiActions } from '@/server/api/actions';

interface AddIntegrationDialogClientProps {
  countries: { label: string; value: string }[];
  institutions: Institution[];
}

export function AddIntegrationDialogClient({
  countries,
  institutions,
}: AddIntegrationDialogClientProps) {
  const { form, handleSubmitWithAction, action } = useHookFormActionWithToast(
    apiActions.integrations.startIntegrationAuth,
    zodResolver(startIntegrationAuthSchema),
    {
      actionProps: {
        loadingToast: 'Connecting to the bank...',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to connect to the bank',
          description: errorMessage,
        }),
        onSuccess: ({ data }) => window.location.assign(data.url),
      },
      formProps: { defaultValues: { country: '', institutionName: '' } },
    },
  );
  const country = useWatch({ control: form.control, name: 'country' });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon={PlusIcon}>Connect bank</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect bank</DialogTitle>
          <DialogDescription>
            Give read access to your bank accounts on your bank&apos;s website, then link them to
            your subaccounts to sync their transactions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
            <FormField
              control={form.control}
              name="country"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Combobox
                      placeholder="Select country"
                      options={countries}
                      onValueChange={(value) => {
                        onChange(value);
                        form.setValue('institutionName', '');
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
              name="institutionName"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Combobox
                      placeholder="Select bank"
                      options={institutions
                        .filter((institution) => institution.country === country)
                        .map((institution) => ({
                          label: institution.name,
                          value: institution.name,
                        }))}
                      onValueChange={onChange}
                      disabled={!country}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="self-stretch sm:self-end"
              disabled={action.isPending}
              isLoading={action.isPending}
            >
              Continue to bank
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
