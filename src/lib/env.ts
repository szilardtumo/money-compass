import { z } from 'zod';

// Schema for client-side environment variables (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Schema for server-side environment variables
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // GitHub Auth
  SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID: z.string().optional(),
  SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET: z.string().optional(),

  // GoCardless
  GOCARDLESS_SECRET_ID: z.string(),
  GOCARDLESS_SECRET_KEY: z.string(),

  // Cron Jobs
  CRON_SECRET: z.string(),

  // Skip env validation
  SKIP_ENV_VALIDATION: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});

// Combined schema
const allEnvSchema = serverEnvSchema.extend(clientEnvSchema.shape);

// Client side env variables need to be destructured in Next.js
const runtimeClientEnv: Record<keyof z.infer<typeof clientEnvSchema>, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function validateEnv(): z.infer<typeof allEnvSchema> {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return process.env as unknown as z.infer<typeof allEnvSchema>;
  }

  const isServer = typeof window === 'undefined';

  const parsed = isServer
    ? allEnvSchema.safeParse(process.env)
    : clientEnvSchema.safeParse(runtimeClientEnv);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
  }

  return parsed.data as z.infer<typeof allEnvSchema>;
}

/**
 * Validated environment variables
 */
export const env = validateEnv();
