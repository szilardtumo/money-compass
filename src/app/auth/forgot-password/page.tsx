'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircledIcon, ReloadIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email('Invalid email'),
});

type FormFields = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const supabase = createBrowserSupabaseClient();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
  });

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  const onSubmit = useCallback(
    async (formFields: FormFields) => {
      const { error } = await supabase.auth.resetPasswordForEmail(formFields.email);

      if (error) {
        setError('root', { message: error.message });
        return;
      }
    },
    [setError, supabase.auth],
  );

  return (
    <div className="mx-auto flex flex-col w-[350px] min-h-[50%] gap-8">
      <h1 className="text-2xl text-center font-semibold tracking-tight">Forgot Password</h1>
      {isSubmitSuccessful && !errors.root && (
        <Alert variant="success">
          <CheckCircledIcon className="size-4" />
          <AlertDescription>
            If an account exists for this email, you will receive password reset instructions.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="h-5 text-sm text-red-500" role="alert">
            {errors.root?.message}
          </p>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <ReloadIcon className="mr-2 size-4 animate-spin" />}
            Reset Password
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Remember your password?{' '}
        <Link href="/auth/login" className="underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
