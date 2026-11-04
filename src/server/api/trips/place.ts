import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { env } from '@/lib/env';

const SYSTEM_PROMPT = `You get the merchant names and currencies of the card payments of one trip, as a bank statement wrote them. Say where the trip was.

Return place: the city, like "Athens, Greece", or the region when the payments span several towns, like "Lake Como, Italy". Use English names.
- The airport, station or shops of the home city at the start or the end of the trip don't count.
- Online merchants, airlines and booking sites don't count.
- Return null when the names don't show a place.`;

/**
 * Asks Claude where the payments of a trip were, like "Athens, Greece". The answer for the same
 * payments is kept, so a failure throws instead of returning null.
 *
 * @param payments Sorted, so the same ones hit the cache
 */
export async function askTripPlace(payments: { name: string; currency: string }[]) {
  'use cache';
  cacheLife('max');

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.parse({
    model: 'claude-haiku-5-5',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payments) }],
    output_config: {
      effort: 'low',
      format: zodOutputFormat(z.object({ place: z.string().nullable() })),
    },
  });
  if (!response.parsed_output) {
    throw new Error(`No parsed output, stop reason ${response.stop_reason}`);
  }
  return response.parsed_output.place?.trim() || null;
}
