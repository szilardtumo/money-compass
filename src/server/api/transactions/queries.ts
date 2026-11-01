import 'server-only';

import { and, count, desc, eq, gte, inArray, isNull, lte, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { groupBy } from '@/lib/utils/group-by';
import { formatPeriodParam, getPeriodRange, parsePeriod, shiftPeriod } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import {
  analyticsSide,
  categoryColumns,
  joinCategory,
  transactionMonth,
} from '../categories/joins';
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
 * Returns the balance of every account and subaccount at the end of each month, in the main
 * currency, the current month last.
 *
 * @param input.months How many months back it starts, else from the month before the first
 * transaction, when there was no balance yet
 */
export const getTransactionHistory = createApiQuery<
  { months?: number } | void,
  TransactionHistory[]
>(async ({ input }) => {
  'use cache: private';
  const { db } = await createApiContext();
  const t = schema.transactions;

  const [{ mainCurrency, mapper }, accounts, sums] = await Promise.all([
    getMainCurrencyWithMapper(),
    db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
    db.rls((tx) =>
      tx
        .select({
          subaccountId: t.subaccountId,
          month: transactionMonth.as('month'),
          amount: sum(t.amount).mapWith(Number),
        })
        .from(t)
        .groupBy(t.subaccountId, sql`month`),
    ),
  ]);
  if (!sums.length) {
    return [];
  }

  const now = parsePeriod(undefined);
  const firstMonth = formatPeriodParam(
    input?.months !== undefined
      ? shiftPeriod(now, -input.months)
      : shiftPeriod(parsePeriod(sums.map((item) => item.month).toSorted()[0]), -1),
  );
  // The balances in the subaccounts' currencies, from the months before the first one
  const balances: Record<string, number> = {};
  const addMonths = (items: typeof sums) => {
    for (const item of items) {
      balances[item.subaccountId] = (balances[item.subaccountId] ?? 0) + item.amount;
    }
  };
  addMonths(sums.filter((item) => item.month < firstMonth));
  const sumsByMonth = groupBy(sums, (item) => item.month);

  const history: TransactionHistory[] = [];
  for (let month = parsePeriod(firstMonth); ; month = shiftPeriod(month, 1)) {
    const param = formatPeriodParam(month);
    if (param > formatPeriodParam(now)) {
      return history;
    }
    addMonths(sumsByMonth[param] ?? []);

    const accountBalances = Object.fromEntries(
      accounts.map((account) => {
        const subaccountBalances = Object.fromEntries(
          account.subaccounts.map((subaccount) => {
            const originalValue = balances[subaccount.id] ?? 0;
            const mainCurrencyValue = toMainCurrency(
              { amount: originalValue, currency: subaccount.currency },
              mapper,
            );
            return [subaccount.id, { originalValue, mainCurrencyValue }];
          }),
        );
        const totalBalance = Object.values(subaccountBalances).reduce(
          (total, balance) => total + balance.mainCurrencyValue,
          0,
        );
        return [account.id, { totalBalance, subaccountBalances }];
      }),
    );
    history.push({
      date: getPeriodRange(month).start,
      totalBalance: Object.values(accountBalances).reduce(
        (total, account) => total + account.totalBalance,
        0,
      ),
      accountBalances,
      mainCurrency,
    });
  }
});
