import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

export default defineConfig({
  dialect: 'postgresql',
  out: './supabase/migrations',
  schema: './src/server/db/schema/index.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  casing: 'snake_case',
  migrations: {
    prefix: 'supabase',
  },
  entities: {
    roles: {
      provider: 'supabase',
    },
  },
});
