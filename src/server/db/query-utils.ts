import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { transactions } from './schema/transactions.schema';

type TransactionForQueryHelper = Pick<
  typeof transactions.$inferSelect,
  'subaccountId' | 'startedDate' | 'sequence'
>;

/**
 * Drizzle query helper for ordering transactions in ascending order
 */
export function ascTransactions() {
  return [asc(transactions.startedDate), asc(transactions.sequence)];
}

/**
 * Drizzle query helper for ordering transactions in descending order
 */
export function descTransactions() {
  return [desc(transactions.startedDate), desc(transactions.sequence)];
}

/**
 * Drizzle query helper for filtering transactions after a transaction
 */
export function afterTransaction(transaction: TransactionForQueryHelper) {
  return and(
    eq(transactions.subaccountId, transaction.subaccountId),
    sql`(${transactions.startedDate}, ${transactions.sequence}) > (${transaction.startedDate.toISOString()}, ${transaction.sequence})`,
  );
}

/**
 * Drizzle query helper for filtering transactions before a transaction
 */
export function beforeTransaction(transaction: TransactionForQueryHelper) {
  return and(
    eq(transactions.subaccountId, transaction.subaccountId),
    sql`(${transactions.startedDate}, ${transactions.sequence}) < (${transaction.startedDate.toISOString()}, ${transaction.sequence})`,
  );
}
