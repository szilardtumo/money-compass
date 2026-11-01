import { pgEnum } from 'drizzle-orm/pg-core';

export const accountCategory = pgEnum('account_category', ['checking', 'investment']);

// Excluded categories don't count in analytics
export const categoryKind = pgEnum('category_kind', ['expense', 'income', 'excluded']);
