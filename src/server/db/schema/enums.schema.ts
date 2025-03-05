import { pgEnum } from 'drizzle-orm/pg-core';

export const accountCategory = pgEnum('account_category', ['checking', 'investment']);
