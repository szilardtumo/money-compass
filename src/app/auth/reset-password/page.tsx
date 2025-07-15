'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSupabaseAuth } from '@/components/providers/supabase-client-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput, strengthRequirements } from '@/components/ui/password-input';

const formSchema = z
  .object({
    password: z
      .string()
      .refine(
        (data) => strengthRequirements.every((req) => req.regex.test(data)),
        'Password must meet all strength requirements',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormFields = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabaseAuth = useSupabaseAuth();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = useCallback(
    async (formFields: FormFields) => {
      const { error } = await supabaseAuth.updateUser({ password: formFields.password });

      if (error) {
        setError('root', { message: error.message });
        return;
      }

      startTransition(() => {
        router.replace(searchParams.get('next') ?? '/dashboard');
      });
    },
    [router, searchParams, setError, supabaseAuth],
  );

  return (
    <Card className="mx-auto w-[400px]">
      <CardHeader>
        <CardTitle className="text-xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {searchParams.has('error') ? (
          <>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="size-4" />
              <AlertTitle>{searchParams.get('error_code')}</AlertTitle>
              <AlertDescription>{searchParams.get('error_description')}</AlertDescription>
            </Alert>
            <Button asChild icon={ArrowLeft} iconAnimation="bounce">
              <Link replace href="/auth/login">
                Back to login
              </Link>
            </Button>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Password" showStrengthIndicator {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Password" {...field} />
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
                disabled={isSubmitting || isPending}
                isLoading={isSubmitting || isPending}
              >
                Reset Password
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
