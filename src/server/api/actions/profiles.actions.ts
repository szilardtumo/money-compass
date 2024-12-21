'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { actionClient } from '@/lib/safe-action';
import { getDb, schema } from '@/server/db';

export const updateProfile = actionClient
  .schema(
    z.object({
      mainCurrency: z.string().length(3).toLowerCase(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const db = await getDb();

    await db.rls(async (tx) => {
      await tx
        .insert(schema.profiles)
        .values({ mainCurrency: parsedInput.mainCurrency })
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { mainCurrency: parsedInput.mainCurrency },
        });
    });

    revalidateTag('profiles');
  });
