'use client';

import { RiGithubFill, RiGoogleFill } from '@remixicon/react';

import { Button } from '@/components/ui/button';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function AuthForm() {
  const supabase = createBrowserSupabaseClient();

  let redirectUrl = '/api/auth/callback';
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-restricted-globals
    redirectUrl = `${location.origin}/api/auth/callback`;
  }

  const signInWithGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { queryParams: { prompt: 'select_account' }, redirectTo: redirectUrl },
    });
  };

  const signInWithGithub = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectUrl },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Button size="lg" onClick={signInWithGoogle}>
        <RiGoogleFill className="w-6 h-7 mr-2" />
        Sign in with Google
      </Button>
      <Button size="lg" onClick={signInWithGithub}>
        <RiGithubFill className="w-6 h-7 mr-2" />
        Sign in with GitHub
      </Button>
    </div>
  );
}
