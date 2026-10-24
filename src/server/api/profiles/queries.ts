import 'server-only';

import { createFullApiContext, createAuthenticatedApiQuery } from '@/lib/api';
import { CACHE_TAGS, cacheTag } from '@/lib/api/cache';
import { SupabaseClaims } from '@/lib/supabase/server';
import { Profile } from '@/lib/types/profiles.types';

/**
 * Maps the user and profile data to the Profile type.
 *
 * @param claims The verified claims of the user's access token.
 * @param profile The profile object from the database.
 * @returns The mapped Profile.
 */
const mapProfileData = (claims: SupabaseClaims, profile: Profile | undefined): Profile => {
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.user_metadata.full_name,
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

  const { db } = await createFullApiContext(ctx);
  const profile = await db.rls((tx) => tx.query.profiles.findFirst());

  return mapProfileData(ctx.claims, profile);
});

/**
 * Retrieves the user's ID from the context.
 *
 * @returns The user's ID as a string.
 */
export const getUserId = createAuthenticatedApiQuery<void, string>(async ({ ctx }) => {
  return ctx.userId;
});
