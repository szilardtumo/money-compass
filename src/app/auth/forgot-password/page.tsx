'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSupabaseAuth } from '@/components/providers/supabase-client-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email('Invalid email'),
});

type FormFields = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const supabaseAuth = useSupabaseAuth();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  let redirectUrl = '/auth/reset-password';
  if (typeof window !== 'undefined') {
    redirectUrl = `${location.origin}/auth/reset-password${location.search}`;
  }

  const onSubmit = useCallback(
    async (formFields: FormFields) => {
      const { error } = await supabaseAuth.resetPasswordForEmail(formFields.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setError('root', { message: error.message });
        return;
      }
    },
    [redirectUrl, setError, supabaseAuth],
  );

  return (
    <Card className="mx-auto w-[400px]">
      <CardHeader>
        <CardTitle className="text-xl">Forgot Password</CardTitle>
        <CardDescription>Enter your email below to reset your password</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
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

            <p className="min-h-5 text-sm text-red-500" role="alert">
              {errors.root?.message}
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Remember your password?{' '}
          <Button asChild variant="linkUnderlined">
            <Link href="/auth/login">Back to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
