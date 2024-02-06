'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthForm() {
  const supabase = createClientComponentClient();

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
      redirectTo={redirectUrl}
    />
  );
}
