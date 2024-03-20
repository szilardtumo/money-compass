import { pgEnum } from 'drizzle-orm/pg-core';

export const accountCategory = pgEnum('account_category', ['checking', 'investment']);

export const transactionType = pgEnum('transaction_type', [
  'card_payment',
  'transfer',
  'exchange',
  'topup',
  'correction',
  'other',
]);
