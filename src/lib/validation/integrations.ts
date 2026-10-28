import { z } from 'zod';

export const startIntegrationAuthSchema = z.object({
  // The same bank name can exist in several countries
  institution: z.object({ name: z.string(), country: z.string() }, 'A bank must be selected.'),
  // Renews the session of this integration instead of creating a new one
  integrationId: z.uuid().optional(),
});

export const setIntegrationAccountLinkSchema = z.object({
  integrationAccountId: z.uuid(),
  subaccountId: z.uuid().nullable(),
});
