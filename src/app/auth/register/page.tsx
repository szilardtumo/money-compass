'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { OAuthButtons } from '@/app/auth/_components/oauth-buttons';
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
import { PasswordInput, strengthRequirements } from '@/components/ui/password-input';
import { SeparatorWithText } from '@/components/ui/separator-with-text';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const formSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .refine((data) => strengthRequirements.every((req) => req.regex.test(data)), {
        message: 'Password must meet all strength requirements',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormFields = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
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
      const { error } = await supabase.auth.signUp({
        email: formFields.email,
        password: formFields.password,
      });

      if (error) {
        setError('root', { message: error.message });
        return;
      }

      startTransition(() => {
        router.replace(searchParams.get('next') ?? '/dashboard');
      });
    },
    [router, searchParams, setError, supabase.auth],
  );

  return (
    <div className="mx-auto flex flex-col w-[350px] min-h-[50%] gap-8">
      <h1 className="text-2xl text-center font-semibold tracking-tight">Register</h1>
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
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="h-5 text-sm text-red-500" role="alert">
            {errors.root?.message}
          </p>

          <Button type="submit" className="w-full" disabled={isSubmitting || isPending}>
            {(isSubmitting || isPending) && <ReloadIcon className="mr-2 size-4 animate-spin" />}
            Register
          </Button>
        </form>
      </Form>
      <SeparatorWithText>Or register with</SeparatorWithText>
      <OAuthButtons />
      <div className="mt-4 text-center text-sm">
        Already registered?{' '}
        <Link href="/auth/login" className="underline">
          Log in here
        </Link>
      </div>
    </div>
  );
}
