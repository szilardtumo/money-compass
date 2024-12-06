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
import { SeparatorWithText } from '@/components/ui/separator-with-text';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormFields = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();
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
      const { error } = await supabase.auth.signInWithPassword({
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
      <h1 className="text-2xl text-center font-semibold tracking-tight">Login</h1>

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
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
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
            Log in
          </Button>
        </form>
      </Form>
      <SeparatorWithText>Or continue with</SeparatorWithText>
      <OAuthButtons />
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
