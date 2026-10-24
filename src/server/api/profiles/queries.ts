import 'server-only';

import { createApiContext, createApiQuery } from '@/lib/api';
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
export const getProfile = createApiQuery<void, Profile>(async () => {
  'use cache: private';
  const ctx = await createApiContext();

  const profile = await ctx.db.rls((tx) => tx.query.profiles.findFirst());

  return mapProfileData(ctx.claims, profile);
});
