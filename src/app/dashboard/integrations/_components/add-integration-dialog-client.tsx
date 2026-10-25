'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';

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
import { startIntegrationAuthSchema } from '@/lib/validation/integrations';
import { apiActions } from '@/server/api/actions';

type InstitutionOption = { name: string; country: string };

const toLabel = (institution: InstitutionOption) => `${institution.name} (${institution.country})`;

interface AddIntegrationDialogClientProps {
  institutions: InstitutionOption[];
}

export function AddIntegrationDialogClient({ institutions }: AddIntegrationDialogClientProps) {
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
    },
  );

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
              name="institution"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Combobox
                      placeholder="Select bank"
                      // The combobox searches the values, so they contain the country code too
                      options={institutions.map((institution) => ({
                        label: toLabel(institution),
                        value: toLabel(institution),
                      }))}
                      value={value && toLabel(value)}
                      onValueChange={(label) =>
                        onChange(institutions.find((institution) => toLabel(institution) === label))
                      }
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
