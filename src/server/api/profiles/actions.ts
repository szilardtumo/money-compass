'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { schema } from '@/server/db';

export const updateProfile = authenticatedActionClient
  .inputSchema(
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

    revalidatePath('/dashboard', 'layout');
  });
