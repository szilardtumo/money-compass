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
import { GocardlessInstitution } from '@/lib/types/integrations.types';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface AddIntegrationFormProps {
  gocardlessInstitutions: GocardlessInstitution[];
  onSuccess: () => void;
}

const formSchema = z.object({
  country: z.string(),
  institutionId: z.string(),
});

type FormFields = z.infer<typeof formSchema>;

const countryOptions = [
  { label: 'Hungary', value: 'HU' },
  { label: 'Romania', value: 'RO' },
];

export function AddIntegrationForm({ gocardlessInstitutions, onSuccess }: AddIntegrationFormProps) {
  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: '',
      institutionId: '',
    },
  });

  async function onSubmit({ institutionId }: FormFields) {
    const promise = apiActions.integrations.createGocardlessIntegration({
      institutionId,
      redirectUrl: window.location.href,
    });

    toast.promise(createToastPromise(promise), {
      loading: 'Creating integration...',
      success:
        "Integration initiated! You will be redirected to the institution's website to confirm the integration.",
      error: () => 'Failed to create integration.',
    });

    const response = await promise;
    if (response.success) {
      window.location.assign(response.data.confirmationUrl);
      onSuccess();
    }
  }

  const selectedCountry = form.watch('country');

  const institutionOptions = useMemo(() => {
    return gocardlessInstitutions
      .filter((institution) => institution.countries.includes(selectedCountry))
      .map((institution) => ({
        label: institution.name,
        value: institution.id,
      }));
  }, [gocardlessInstitutions, selectedCountry]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="country"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Combobox
                  placeholder="Select country"
                  options={countryOptions}
                  onValueChange={onChange}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="institutionId"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Institution</FormLabel>
              <FormControl>
                <Combobox
                  placeholder="Select your institution"
                  options={institutionOptions}
                  onValueChange={onChange}
                  disabled={!selectedCountry}
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
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
