'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { OAuthButtons } from '@/app/auth/_components/oauth-buttons';
import { useSupabaseAuth } from '@/components/providers/supabase-client-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const supabaseAuth = useSupabaseAuth();
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
      const { error } = await supabaseAuth.signUp({
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
    [router, searchParams, setError, supabaseAuth],
  );

  return (
    <Card className="mx-auto w-[400px]">
      <CardHeader>
        <CardTitle className="text-xl">Register</CardTitle>
        <CardDescription>Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
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

            <p className="min-h-5 text-sm text-red-500" role="alert">
              {errors.root?.message}
            </p>

            <Button
              type="submit"
              className="w-full"
              icon={ArrowRight}
              iconPlacement="right"
              iconAnimation="expand"
              disabled={isSubmitting || isPending}
              isLoading={isSubmitting || isPending}
            >
              Register
            </Button>
          </form>
        </Form>
        <SeparatorWithText>Or register with</SeparatorWithText>
        <OAuthButtons />
        <div className="mt-4 text-center text-sm">
          Already registered?{' '}
          <Button asChild variant="linkUnderlined">
            <Link href="/auth/login">Log in here</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
