import 'server-only';

import { User } from '@supabase/supabase-js';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { AuthenticationError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/types/profiles.types';
import { getDb } from '@/server/db';

import { createAuthenticatedApiQuery } from '../create-api-query';

/**
 * Maps the user and profile data to the Profile type.
 *
 * @param user The user object from Supabase.
 * @param profile The profile object from the database.
 * @returns The mapped Profile.
 */
const mapProfileData = (user: User, profile: Profile | undefined): Profile => {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata.full_name,
    mainCurrency: profile?.mainCurrency ?? 'eur',
  };
};

/**
 * Returns the user profile with their basic information and preferences.
 *
 * @returns The user profile with id, email, name and main currency.
 */
export const getProfile = createAuthenticatedApiQuery<void, Profile>(async ({ ctx }) => {
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
    throw new AuthenticationError('User not found or not authenticated');
  }

  return mapProfileData(user, profile);
});

/**
 * Retrieves the user's ID from the context.
 *
 * @returns The user's ID as a string.
 */
export const getUserId = createAuthenticatedApiQuery<void, string>(async ({ ctx }) => {
  return ctx.userId;
});
