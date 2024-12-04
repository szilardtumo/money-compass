import { sql } from 'drizzle-orm';

export const authUid = sql.raw(`auth.uid()`);
