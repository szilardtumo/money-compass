'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

import { createBrowserSupabaseClient } from '@/lib/utils/supabase/client';

export default function AuthForm() {
  const supabase = createBrowserSupabaseClient();

  let redirectUrl = '/api/auth/callback';
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-restricted-globals
    redirectUrl = `${location.origin}/api/auth/callback`;
  }

  return (
    <Auth
      appearance={{ theme: ThemeSupa }}
      supabaseClient={supabase}
      providers={['google']}
      queryParams={{ prompt: 'select_account' }}
      redirectTo={redirectUrl}
    />
  );
}
