'use server';

import { z } from 'zod';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { authenticatedActionClient } from '@/lib/safe-action/client';
import { schema } from '@/server/db';

export const updateProfile = authenticatedActionClient
  .schema(
    z.object({
      mainCurrency: z.string().length(3).toLowerCase(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    await ctx.db.rls(async (tx) => {
      await tx
        .insert(schema.profiles)
        .values({
          id: ctx.userId,
          mainCurrency: parsedInput.mainCurrency,
        })
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { mainCurrency: parsedInput.mainCurrency },
        });
    });

    revalidateTag({ tag: CACHE_TAGS.profiles, userId: ctx.userId });
  });
