import { sql } from 'drizzle-orm';

export const authUidDefault = sql.raw(`auth.uid()`);
export const authUid = sql.raw(`(select auth.uid())`);
