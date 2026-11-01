import { z } from 'zod';

/**
 * The subaccount IDs of a URL param like "<id>,<id>", the accounts the analytics page and the
 * drawers count, or undefined for all.
 */
export function parseSubaccountsParam(value: unknown) {
  return z
    .array(z.uuid())
    .min(1)
    .safeParse(typeof value === 'string' ? value.split(',') : undefined).data;
}
