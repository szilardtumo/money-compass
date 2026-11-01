import 'server-only';

import { and, count, eq, gte, inArray, isNull, lt, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import {
  Analytics,
  AnalyticsSide,
  AnalyticsTotal,
  TransactionTotal,
} from '@/lib/types/analytics.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import {
  formatPeriodParam,
  getChartMonths,
  getPeriodRange,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { analyticsSide, categoryColumns, joinCategory } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

const t = schema.transactions;

/**
 * Sums the transactions by day, month or year, where they count in analytics, category and merchant,
 * in the main currency. The pages that show totals over time build on it.
 */
export const getTotals = createApiQuery<
  {
    /** ISO date of the first moment */
    from: string;
    /** ISO date of the moment after the last */
    to: string;
    bucket: 'day' | 'month' | 'year';
    subaccountIds?: string[];
    /** The transaction's category, or null for the uncategorized ones that count in analytics */
    categoryId?: string | null;
    merchantId?: string;
  },
  { mainCurrency: string; totals: TransactionTotal[] }
>(async ({ input }) => {
  'use cache: private';
  const { db } = await createApiContext();
  // The merchant's own category, while the side follows each transaction's category
  const merchantCategory = alias(schema.categories, 'merchant_category');
  const format = { day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' }[input.bucket];

  const [rows, { mainCurrency, mapper }] = await Promise.all([
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            bucket: sql<string>`to_char(${t.startedDate} at time zone 'UTC', ${format})`.as(
              'bucket',
            ),
            side: analyticsSide.as('side'),
            category: categoryColumns,
            merchant: { id: schema.merchants.id, name: schema.merchants.name },
            merchantCategory: {
              id: merchantCategory.id,
              name: merchantCategory.name,
              kind: merchantCategory.kind,
              icon: merchantCategory.icon,
              color: merchantCategory.color,
            },
            currency: schema.subaccounts.currency,
            amount: sum(t.amount).mapWith(Number),
            transactionCount: count(),
          })
          .from(t)
          .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
          .$dynamic(),
      )
        .leftJoin(merchantCategory, eq(merchantCategory.id, schema.merchants.categoryId))
        .where(
          and(
            gte(t.startedDate, new Date(input.from)),
            lt(t.startedDate, new Date(input.to)),
            input.subaccountIds?.length ? inArray(t.subaccountId, input.subaccountIds) : undefined,
            input.categoryId === null
              ? and(isNull(schema.categories.id), sql`${analyticsSide} <> 'excluded'`)
              : input.categoryId
                ? eq(schema.categories.id, input.categoryId)
                : undefined,
            input.merchantId ? eq(schema.merchants.id, input.merchantId) : undefined,
          ),
        )
        .groupBy(
          sql`bucket`,
          sql`side`,
          schema.categories.id,
          schema.merchants.id,
          merchantCategory.id,
          schema.subaccounts.currency,
        ),
    ),
    getMainCurrencyWithMapper(),
  ]);

  // A row per currency, merged once converted
  const totals = new Map<string, TransactionTotal>();
  for (const { currency, merchantCategory, ...row } of rows) {
    const key = [row.bucket, row.side, row.category?.id, row.merchant?.id].join('|');
    const total = totals.get(key) ?? {
      ...row,
      merchant: row.merchant && { ...row.merchant, category: merchantCategory },
      amount: 0,
      transactionCount: 0,
    };
    totals.set(key, total);
    total.amount += toMainCurrency({ amount: row.amount, currency }, mapper);
    total.transactionCount += row.transactionCount;
  }

  return { mainCurrency, totals: [...totals.values()] };
});

/**
 * Returns the spending and income of a period by category and merchant, compared to the period
 * before, and the totals of its year's months or of the years up to it for a chart, and the daily
 * spending of its month and the one before. Amounts are in the main currency.
 *
 * @param input.period Like "2026-10" for a month or "2026" for a year
 * @param input.subaccountIds Only the transactions of these subaccounts, else of all
 */
export const getAnalytics = createApiQuery<{ period: string; subaccountIds?: string[] }, Analytics>(
  async ({ input }) => {
    'use cache: private';
    const period = parsePeriod(input.period);
    const previous = shiftPeriod(period, -1);
    const chartPeriods =
      period.unit === 'year'
        ? Array.from({ length: 5 }, (_, index) => shiftPeriod(period, index - 4))
        : getChartMonths(input.period).map((month) => parsePeriod(month));
    const ranges = [...chartPeriods, previous].map(getPeriodRange);
    const paceMonths = period.unit === 'month' ? [previous, period] : [];

    const [{ mainCurrency, totals: rows }, pace] = await Promise.all([
      getTotals({
        from: new Date(Math.min(...ranges.map((range) => range.start.getTime()))).toISOString(),
        to: new Date(Math.max(...ranges.map((range) => range.end.getTime()))).toISOString(),
        bucket: period.unit,
        subaccountIds: input.subaccountIds,
      }),
      paceMonths.length
        ? getTotals({
            from: getPeriodRange(previous).start.toISOString(),
            to: getPeriodRange(period).end.toISOString(),
            bucket: 'day',
            subaccountIds: input.subaccountIds,
          })
        : null,
    ]);

    const currentParam = formatPeriodParam(period);
    const previousParam = formatPeriodParam(previous);
    const chart = chartPeriods.map((item) => ({
      period: formatPeriodParam(item),
      spending: 0,
      income: 0,
    }));
    const chartByPeriod = new Map(chart.map((item) => [item.period, item]));
    type CategoryTotal = Analytics['categories'][AnalyticsSide][number];
    type MerchantTotal = Analytics['merchants'][AnalyticsSide][number];
    const categories = {
      spending: new Map<string | null, CategoryTotal>(),
      income: new Map<string | null, CategoryTotal>(),
    };
    const merchants = {
      spending: new Map<string, MerchantTotal>(),
      income: new Map<string, MerchantTotal>(),
    };
    const add = (total: AnalyticsTotal, isCurrent: boolean, amount: number, count: number) => {
      if (isCurrent) {
        total.amount += amount;
        total.transactionCount += count;
      } else {
        total.previousAmount += amount;
      }
    };
    for (const row of rows) {
      const isCurrent = row.bucket === currentParam;
      if (row.side === 'excluded') {
        continue;
      }

      // Spending is positive, so a category's refunds lower it
      const amount = row.side === 'spending' ? -row.amount : row.amount;
      const chartItem = chartByPeriod.get(row.bucket);
      if (chartItem) {
        chartItem[row.side] += amount;
      }
      if (!isCurrent && row.bucket !== previousParam) {
        continue;
      }

      const categoryKey = row.category?.id ?? null;
      const category = categories[row.side].get(categoryKey) ?? {
        category: row.category,
        amount: 0,
        previousAmount: 0,
        transactionCount: 0,
      };
      categories[row.side].set(categoryKey, category);
      add(category, isCurrent, amount, row.transactionCount);

      if (row.merchant) {
        const merchant = merchants[row.side].get(row.merchant.id) ?? {
          merchant: { id: row.merchant.id, name: row.merchant.name },
          category: row.merchant.category,
          amount: 0,
          previousAmount: 0,
          transactionCount: 0,
        };
        merchants[row.side].set(row.merchant.id, merchant);
        add(merchant, isCurrent, amount, row.transactionCount);
      }
    }

    const byAmount = <T extends AnalyticsTotal>(items: Iterable<T>) =>
      [...items].filter((item) => item.transactionCount).toSorted((a, b) => b.amount - a.amount);
    const totalOf = (key: AnalyticsSide) => {
      const items = [...categories[key].values()];
      return {
        amount: items.reduce((total, item) => total + item.amount, 0),
        previousAmount: items.reduce((total, item) => total + item.previousAmount, 0),
      };
    };

    // The running total of each day of the months, until today
    const today = new Date().toISOString().slice(0, 10);
    const spentByDay = new Map<string, number>();
    for (const row of pace?.totals ?? []) {
      if (row.side === 'spending') {
        spentByDay.set(row.bucket, (spentByDay.get(row.bucket) ?? 0) - row.amount);
      }
    }
    const [previousDays, days] = paceMonths.map((month) => {
      const param = formatPeriodParam(month);
      let total = 0;
      return Array.from(
        { length: new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate() },
        (_, index) => {
          const day = `${param}-${String(index + 1).padStart(2, '0')}`;
          total += spentByDay.get(day) ?? 0;
          return day > today ? null : total;
        },
      );
    });

    return {
      mainCurrency,
      totals: { spending: totalOf('spending'), income: totalOf('income') },
      chart,
      categories: {
        spending: byAmount(categories.spending.values()),
        income: byAmount(categories.income.values()),
      },
      merchants: {
        spending: byAmount(merchants.spending.values()).slice(0, 50),
        income: byAmount(merchants.income.values()).slice(0, 50),
      },
      pace: days ? { month: currentParam, days, previousDays } : null,
    };
  },
);

/**
 * Returns the income and the spending of this month and the 12 before it in the main currency, the
 * oldest first. Spending is positive.
 */
export const getMonthlyCashFlow = createApiQuery<
  void,
  { mainCurrency: string; months: ({ month: string } & Record<AnalyticsSide, number>)[] }
>(async () => {
  'use cache: private';
  const now = parsePeriod(undefined);
  const months = new Map(
    Array.from({ length: 13 }, (_, index) => {
      const month = formatPeriodParam(shiftPeriod(now, index - 12));
      return [month, { month, spending: 0, income: 0 }];
    }),
  );
  const { mainCurrency, totals } = await getTotals({
    from: getPeriodRange(shiftPeriod(now, -12)).start.toISOString(),
    to: getPeriodRange(now).end.toISOString(),
    bucket: 'month',
  });
  for (const row of totals) {
    const month = months.get(row.bucket);
    if (month && row.side !== 'excluded') {
      month[row.side] += row.side === 'spending' ? -row.amount : row.amount;
    }
  }

  return { mainCurrency, months: [...months.values()] };
});
