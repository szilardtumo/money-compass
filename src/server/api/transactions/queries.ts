import 'server-only';

import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { AnalyticsSide } from '@/lib/types/analytics.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { groupBy } from '@/lib/utils/group-by';
import { generateTimeBuckets, TimeInterval } from '@/lib/utils/time-buckets';
import { schema } from '@/server/db';

import { analyticsSide, categoryColumns, joinCategory } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

type DbTransactionWithSubaccount = typeof schema.transactions.$inferSelect & {
  balance: number;
  subaccount: typeof schema.subaccounts.$inferSelect;
} & Pick<Transaction, 'linkedTransaction' | 'merchant' | 'category' | 'excluded'>;

/**
 * Maps a database transaction to the Transaction domain model with currency conversion
 *
 * @param data The database transaction with its balance and subaccount
 * @param mainCurrency The main currency of the user
 * @param mainCurrencyMapper The mapper of the main currency
 * @returns The mapped Transaction
 */
const mapTransactionData = (
  data: DbTransactionWithSubaccount,
  mainCurrency: string,
  mainCurrencyMapper: CurrencyMapper,
): Transaction => {
  const originalCurrency = data.subaccount.currency;
  const exchangeRate = mainCurrencyMapper[originalCurrency];

  if (!exchangeRate) {
    throw new MissingExchangeRateError(originalCurrency);
  }

  return {
    id: data.id,
    accountId: data.subaccount.accountId,
    subaccountId: data.subaccountId,
    type: data.type,
    amount: {
      originalValue: data.amount,
      mainCurrencyValue: data.amount * exchangeRate,
    },
    balance: {
      originalValue: data.balance,
      mainCurrencyValue: data.balance * exchangeRate,
    },
    originalCurrency,
    mainCurrency,
    startedDate: data.startedDate,
    description: data.description,
    counterpartyName: data.counterpartyName,
    dataSource: data.dataSource,
    createdAt: data.createdAt,
    linkedTransaction: data.linkedTransaction,
    merchant: data.merchant,
    category: data.category,
    categorySource: data.categoryId ? 'transaction' : data.category ? 'merchant' : null,
    excluded: data.excluded,
  };
};

/**
 * Returns a paginated list of transactions with optional filtering
 *
 * The transactions are converted to the user's main currency for consistent display
 *
 * @param params The parameters for fetching transactions
 * @returns The paginated list of transactions
 */
export const getTransactions = createApiQuery<
  {
    /** The ID of the account to filter by */
    accountId?: string;
    /** The IDs of the subaccounts to filter by */
    subaccountIds?: string[];
    /** The start date of the date range to filter by */
    fromDate?: string;
    /** The end date of the date range to filter by */
    toDate?: string;
    /** The ID of the category to filter by, or null for uncategorized transactions that count in analytics */
    categoryId?: string | null;
    /** The ID of the merchant to filter by */
    merchantId?: string;
    /** Where the transactions count in analytics */
    side?: AnalyticsSide | 'excluded';
    /** The page number to fetch */
    page?: number;
    /** The number of transactions per page */
    pageSize?: number;
  } | void,
  Paginated<Transaction>
>(
  async ({
    input: {
      accountId,
      subaccountIds,
      fromDate,
      toDate,
      categoryId,
      merchantId,
      side,
      page = 0,
      pageSize = 20,
    } = {},
  }) => {
    'use cache: private';
    const { db } = await createApiContext();
    const linked = alias(schema.transactions, 'linked');
    const linkedSubaccount = alias(schema.subaccounts, 'linked_subaccount');

    // Set up the database query
    const query = db.rls(async (tx) => {
      const rows = await joinCategory(
        tx
          .select({
            transaction: schema.transactions,
            balance: schema.transactionBalances.balance,
            subaccount: schema.subaccounts,
            linkedAmount: linked.amount,
            linkedCurrency: linkedSubaccount.currency,
            merchant: { id: schema.merchants.id, name: schema.merchants.name },
            category: categoryColumns,
            side: analyticsSide,
          })
          .from(schema.transactions)
          .innerJoin(
            schema.transactionBalances,
            eq(schema.transactions.id, schema.transactionBalances.transactionId),
          )
          .innerJoin(
            schema.subaccounts,
            eq(schema.transactions.subaccountId, schema.subaccounts.id),
          )
          .leftJoin(linked, eq(schema.transactions.linkedTransactionId, linked.id))
          .leftJoin(linkedSubaccount, eq(linked.subaccountId, linkedSubaccount.id))
          .$dynamic(),
      )
        .where(
          and(
            accountId ? eq(schema.subaccounts.accountId, accountId) : undefined,
            subaccountIds?.length
              ? inArray(schema.transactions.subaccountId, subaccountIds)
              : undefined,
            fromDate ? gte(schema.transactions.startedDate, new Date(fromDate)) : undefined,
            toDate ? lte(schema.transactions.startedDate, new Date(toDate)) : undefined,
            categoryId === null
              ? and(isNull(schema.categories.id), sql`${analyticsSide} <> 'excluded'`)
              : categoryId
                ? eq(schema.categories.id, categoryId)
                : undefined,
            merchantId ? eq(schema.merchants.id, merchantId) : undefined,
            side ? sql`${analyticsSide} = ${side}` : undefined,
          ),
        )
        .orderBy(desc(schema.transactions.startedDate), desc(schema.transactions.sequence))
        .offset(page * pageSize)
        .limit(pageSize);

      // The size of the merchants, for "All 107 from Lidl" in the category picker
      const merchantIds = [...new Set(rows.flatMap((row) => row.merchant?.id ?? []))];
      const merchantCounts = merchantIds.length
        ? await tx
            .select({ merchantId: schema.transactions.merchantId, value: count() })
            .from(schema.transactions)
            .where(inArray(schema.transactions.merchantId, merchantIds))
            .groupBy(schema.transactions.merchantId)
        : [];
      const countsById = new Map(merchantCounts.map((item) => [item.merchantId, item.value]));

      return rows.map((row) => ({
        ...row,
        merchant: row.merchant && {
          ...row.merchant,
          transactionCount: countsById.get(row.merchant.id) ?? 0,
        },
      }));
    });

    // Run the database query and get the main currency in parallel
    const [data, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
      query,
      getMainCurrencyWithMapper(),
    ]);

    // Map the transactions to the Transaction domain model
    return {
      data: data.map((item) =>
        mapTransactionData(
          {
            ...item.transaction,
            balance: item.balance,
            subaccount: item.subaccount,
            linkedTransaction:
              item.linkedAmount !== null && item.linkedCurrency !== null
                ? { amount: item.linkedAmount, currency: item.linkedCurrency }
                : null,
            merchant: item.merchant,
            category: item.category,
            excluded: item.side === 'excluded',
          },
          mainCurrency,
          mainCurrencyMapper,
        ),
      ),
      page,
      pageSize,
    };
  },
);

/**
 * Returns transaction history aggregated by time intervals
 *
 * The history includes account and subaccount balances at the end of each interval,
 * with all values converted to the user's main currency
 */
export const getTransactionHistory = createApiQuery<
  {
    /** The date range to fetch the history for */
    dateRange: TimeInterval;
    /** The interval to aggregate the history by */
    interval: TimeInterval;
  },
  TransactionHistory[]
>(async ({ input }) => {
  'use cache: private';
  const { db } = await createApiContext();

  const timeBuckets = generateTimeBuckets(input.dateRange, input.interval);

  // Run the database queries in parallel
  const [{ mainCurrency, mapper: mainCurrencyMapper }, accounts, sums] = await Promise.all([
    getMainCurrencyWithMapper(),
    db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
    db.rls((tx) =>
      tx
        .select({
          subaccountId: schema.transactions.subaccountId,
          // 0 for transactions before the first time bucket, n for transactions in the nth time bucket
          bucketIndex:
            sql<number>`width_bucket(${schema.transactions.startedDate}, array[${sql.join(
              timeBuckets.map((date) => sql`${date.toISOString()}`),
              sql`, `,
            )}]::timestamptz[])`
              .mapWith(Number)
              .as('bucket_index'),
          amount: sql<number>`sum(${schema.transactions.amount})`.mapWith(Number),
        })
        .from(schema.transactions)
        .groupBy(schema.transactions.subaccountId, sql`bucket_index`),
    ),
  ]);

  // If there are no transactions, return an empty array
  if (sums.length === 0) {
    return [];
  }

  const sumsByBucket = groupBy(sums, (item) => String(item.bucketIndex));

  // Contains the current balance of each subaccount in its original currency
  const currentBalances: Record<string, number> = {};
  const addBucketToBalances = (bucketIndex: number) =>
    sumsByBucket[bucketIndex]?.forEach((item) => {
      currentBalances[item.subaccountId] = (currentBalances[item.subaccountId] ?? 0) + item.amount;
    });

  // Transactions before the date range make up the starting balances
  addBucketToBalances(0);

  const history = timeBuckets.map((date, index) => {
    addBucketToBalances(index + 1);

    return {
      date,
      accountBalances: Object.fromEntries(
        accounts.map((account) => {
          const subaccountBalances = Object.fromEntries(
            account.subaccounts.map((subaccount) => {
              const originalValue = currentBalances[subaccount.id] ?? 0;
              const exchangeRate = mainCurrencyMapper[subaccount.currency];

              if (!exchangeRate) {
                throw new MissingExchangeRateError(subaccount.currency);
              }

              return [
                subaccount.id,
                {
                  originalValue,
                  mainCurrencyValue: originalValue * exchangeRate,
                },
              ];
            }),
          );

          return [
            account.id,
            {
              totalBalance: Object.values(subaccountBalances).reduce(
                (sum, balance) => sum + balance.mainCurrencyValue,
                0,
              ),
              subaccountBalances,
            },
          ] as const;
        }),
      ),
      mainCurrency,
    } satisfies TransactionHistory;
  });

  // Only keep the time buckets from the first one with a balance
  const firstBucketIndex = Math.max(Math.min(...sums.map((item) => item.bucketIndex)) - 1, 0);
  return history.slice(firstBucketIndex);
});
