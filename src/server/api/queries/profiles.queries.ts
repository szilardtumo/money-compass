import 'server-only';

import { redirect } from 'next/navigation';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAuthenticatedApiQuery } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';

export const getProfile = createAuthenticatedApiQuery(async ({ ctx }) => {
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

/**
 * Retrieves the user's ID from the context.
 *
 * @returns The user's ID as a string.
 */
export const getUserId = createAuthenticatedApiQuery<void, string>(async ({ ctx }) => ctx.userId);
