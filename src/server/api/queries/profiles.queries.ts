import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/types/profiles.types';

export async function getProfile(): Promise<Profile> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['profiles'] } });

  const [
    {
      data: { user },
      error: userError,
    },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select().maybeSingle(),
  ]);

  if (profileError) {
    throw profileError;
  }

  if (userError || !user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata.full_name,
    mainCurrency: profile?.main_currency ?? 'eur',
  };
}
