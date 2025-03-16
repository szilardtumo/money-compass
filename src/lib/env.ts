import { z } from 'zod';

/**
 * Schema for environment variables
 */
const envSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID: z.string().optional(),
  SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Drizzle
  DATABASE_URL: z.string().min(1),

  // GoCardless
  GOCARDLESS_SECRET_ID: z.string(),
  GOCARDLESS_SECRET_KEY: z.string(),

  // Cron Jobs
  CRON_SECRET: z.string(),

  // Skip env validation
  SKIP_ENV_VALIDATION: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});

/**
 * Validate environment variables
 */
function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validated environment variables
 */
export const env = validateEnv();
