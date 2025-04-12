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
import { PasswordInput } from '@/components/ui/password-input';
import { SeparatorWithText } from '@/components/ui/separator-with-text';

const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormFields = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabaseAuth = useSupabaseAuth();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
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
      const { error } = await supabaseAuth.signInWithPassword({
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
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
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
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Button asChild variant="linkUnderlined" className="ml-auto">
                      <Link href="/auth/forgot-password">Forgot your password?</Link>
                    </Button>
                  </div>
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
              Log in
            </Button>
          </form>
        </Form>
        <SeparatorWithText>Or continue with</SeparatorWithText>
        <OAuthButtons />
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Button asChild variant="linkUnderlined">
            <Link href="/auth/register">Register here</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
