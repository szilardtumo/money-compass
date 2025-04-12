'use server';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/profiles/queries';
import { getDb, schema } from '@/server/db';

interface UpdateProfileParams {
  mainCurrency: string;
}

export async function updateProfile(params: UpdateProfileParams): Promise<ActionResponse> {
  const db = await getDb();
  const userId = await getUserId();

  try {
    await db.rls(async (tx) => {
      await tx
        .insert(schema.profiles)
        .values({
          id: userId,
          mainCurrency: params.mainCurrency,
        })
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { mainCurrency: params.mainCurrency },
        });
    });

    revalidateTag({ tag: CACHE_TAGS.profiles, userId });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'database_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
