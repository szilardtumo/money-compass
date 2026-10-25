import { z } from 'zod';

export const startIntegrationAuthSchema = z.object({
  country: z.string().min(1, 'A country must be selected.'),
  institutionName: z.string().min(1, 'A bank must be selected.'),
  // Renews the session of this integration instead of creating a new one
  integrationId: z.uuid().optional(),
});

export const setIntegrationAccountLinkSchema = z.object({
  integrationAccountId: z.uuid(),
  subaccountId: z.uuid().nullable(),
});
