import 'server-only';

import { redirect } from 'next/navigation';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createApiQuery } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';

export const getProfile = createApiQuery(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.profiles);

  const supabase = await createServerSupabaseClient(ctx.plainCookies);
  const db = await getDb(ctx.supabaseToken);

  const [
    {
      data: { user },
      error: userError,
    },
    profile,
  ] = await Promise.all([supabase.auth.getUser(), db.rls((tx) => tx.query.profiles.findFirst())]);

  if (userError || !user) {
    redirect('/auth/login');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata.full_name,
    mainCurrency: profile?.mainCurrency ?? 'eur',
  };
});
