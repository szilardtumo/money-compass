import 'server-only';

import { and, count, eq, gte, lt, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Analytics, AnalyticsSide, AnalyticsTotal } from '@/lib/types/analytics.types';
import {
  formatPeriodLabel,
  formatPeriodParam,
  getPeriodRange,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { analyticsSide, categoryColumns, joinCategory } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

const t = schema.transactions;

/**
 * Returns the spending and income of a period by category and merchant, compared to the period
 * before, and the totals of the periods before it for a chart. Amounts are in the main currency.
 *
 * @param input The period, like "2026-10" for a month or "2026" for a year
 */
export const getAnalytics = createApiQuery<{ period: string }, Analytics>(async ({ input }) => {
  'use cache: private';
  const { db } = await createApiContext();

  const period = parsePeriod(input.period);
  const chartPeriods = Array.from({ length: period.unit === 'month' ? 12 : 5 }, (_, index) =>
    shiftPeriod(period, index - (period.unit === 'month' ? 11 : 4)),
  );
  const chartStart = getPeriodRange(chartPeriods[0]).start;
  const previousStart = getPeriodRange(shiftPeriod(period, -1)).start;
  const { start, end } = getPeriodRange(period);
  // The merchant's own category, while the side follows each transaction's category
  const merchantCategory = alias(schema.categories, 'merchant_category');
  const bucket = sql<string>`to_char(date_trunc(${period.unit}, ${t.startedDate} at time zone 'UTC'), ${period.unit === 'month' ? 'YYYY-MM' : 'YYYY'})`;

  const [rows, merchantRows, { mainCurrency, mapper }] = await Promise.all([
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            period: bucket.as('period'),
            side: analyticsSide.as('side'),
            category: categoryColumns,
            currency: schema.subaccounts.currency,
            amount: sum(t.amount).mapWith(Number),
            transactionCount: count(),
          })
          .from(t)
          .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
          .$dynamic(),
      )
        .where(and(gte(t.startedDate, chartStart), lt(t.startedDate, end)))
        .groupBy(sql`period`, sql`side`, schema.categories.id, schema.subaccounts.currency),
    ),
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            isCurrent: sql<boolean>`${t.startedDate} >= ${start.toISOString()}`.as('is_current'),
            side: analyticsSide.as('side'),
            merchant: { id: schema.merchants.id, name: schema.merchants.name },
            category: {
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
        .where(and(gte(t.startedDate, previousStart), lt(t.startedDate, end)))
        .groupBy(
          sql`is_current`,
          sql`side`,
          schema.merchants.id,
          merchantCategory.id,
          schema.subaccounts.currency,
        ),
    ),
    getMainCurrencyWithMapper(),
  ]);

  // Spending is positive, so a category's refunds lower it
  const toMain = (row: { currency: string; amount: number }, side: AnalyticsSide) => {
    const rate = mapper[row.currency];
    if (!rate) {
      throw new MissingExchangeRateError(row.currency);
    }
    return row.amount * rate * (side === 'spending' ? -1 : 1);
  };
  const add = (total: AnalyticsTotal, isCurrent: boolean, amount: number, count: number) => {
    if (isCurrent) {
      total.amount += amount;
      total.transactionCount += count;
    } else {
      total.previousAmount += amount;
    }
  };
  const emptyTotal = (): AnalyticsTotal => ({ amount: 0, previousAmount: 0, transactionCount: 0 });

  const currentParam = formatPeriodParam(period);
  const previousParam = formatPeriodParam(shiftPeriod(period, -1));
  const chart = chartPeriods.map((item) => ({
    period: formatPeriodParam(item),
    label: formatPeriodLabel(item, 'short'),
    spending: 0,
    income: 0,
  }));
  type CategoryTotal = Analytics['categories'][AnalyticsSide][number];
  const categories = {
    spending: new Map<string | null, CategoryTotal>(),
    income: new Map<string | null, CategoryTotal>(),
  };
  let excludedCount = 0;

  for (const row of rows) {
    if (row.side === 'excluded') {
      excludedCount += row.period === currentParam ? row.transactionCount : 0;
      continue;
    }

    const amount = toMain(row, row.side);
    const chartItem = chart.find((item) => item.period === row.period);
    if (chartItem) {
      chartItem[row.side] += amount;
    }
    if (row.period !== currentParam && row.period !== previousParam) {
      continue;
    }

    const key = row.category?.id ?? null;
    const total = categories[row.side].get(key) ?? { category: row.category, ...emptyTotal() };
    categories[row.side].set(key, total);
    add(total, row.period === currentParam, amount, row.transactionCount);
  }

  type MerchantTotal = Analytics['merchants'][AnalyticsSide][number];
  const merchants = {
    spending: new Map<string, MerchantTotal>(),
    income: new Map<string, MerchantTotal>(),
  };
  for (const row of merchantRows) {
    if (row.side === 'excluded' || !row.merchant) {
      continue;
    }
    const total = merchants[row.side].get(row.merchant.id) ?? {
      merchant: row.merchant,
      category: row.category,
      ...emptyTotal(),
    };
    merchants[row.side].set(row.merchant.id, total);
    add(total, row.isCurrent, toMain(row, row.side), row.transactionCount);
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
    excludedCount,
  };
});
