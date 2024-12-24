import { RiGithubFill, RiGoogleFill } from '@remixicon/react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useBrowserSupabaseClient } from '@/lib/supabase/client';

export function OAuthButtons() {
  const supabase = useBrowserSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);

  let oAuthRedirectUrl = '/api/auth/callback';
  if (typeof window !== 'undefined') {
    oAuthRedirectUrl = `${location.origin}/api/auth/callback${location.search}`;
  }

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { prompt: 'select_account' }, redirectTo: oAuthRedirectUrl },
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, oAuthRedirectUrl]);

  const signInWithGithub = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: oAuthRedirectUrl },
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, oAuthRedirectUrl]);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="outline" icon={RiGoogleFill} onClick={signInWithGoogle} disabled={isLoading}>
        Google
      </Button>
      <Button variant="outline" icon={RiGithubFill} onClick={signInWithGithub} disabled={isLoading}>
        GitHub
      </Button>
    </div>
  );
}
