import { Profile } from '@/lib/types/profiles.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

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
