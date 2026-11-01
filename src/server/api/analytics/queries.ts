import 'server-only';

import { and, count, eq, gte, lt, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Analytics, AnalyticsSide, AnalyticsTotal } from '@/lib/types/analytics.types';
import {
  formatPeriodLabel,
  formatPeriodParam,
  getLastMonths,
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
 * @param input The period, like "2026-10" for a month or "2026" for a year, else the last 12 months
 */
export const getAnalytics = createApiQuery<{ period?: string }, Analytics>(async ({ input }) => {
  'use cache: private';
  const { db } = await createApiContext();

  const period = parsePeriod(input.period);
  const current = input.period ? [period] : getLastMonths().map((month) => parsePeriod(month));
  const previous = current.map((item) => shiftPeriod(item, -current.length));
  const chartPeriods = input.period
    ? Array.from({ length: period.unit === 'month' ? 12 : 5 }, (_, index) =>
        shiftPeriod(period, index - (period.unit === 'month' ? 11 : 4)),
      )
    : current;
  const start = getPeriodRange(input.period ? chartPeriods[0] : previous[0]).start;
  const { end } = getPeriodRange(period);
  // The merchant's own category, while the side follows each transaction's category
  const merchantCategory = alias(schema.categories, 'merchant_category');
  const bucket = sql<string>`to_char(date_trunc(${period.unit}, ${t.startedDate} at time zone 'UTC'), ${period.unit === 'month' ? 'YYYY-MM' : 'YYYY'})`;

  const [rows, { mainCurrency, mapper }] = await Promise.all([
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            period: bucket.as('period'),
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
        .where(and(gte(t.startedDate, start), lt(t.startedDate, end)))
        .groupBy(
          sql`period`,
          sql`side`,
          schema.categories.id,
          schema.merchants.id,
          merchantCategory.id,
          schema.subaccounts.currency,
        ),
    ),
    getMainCurrencyWithMapper(),
  ]);

  const currentParams = current.map(formatPeriodParam);
  const previousParams = previous.map(formatPeriodParam);
  const chart = chartPeriods.map((item) => ({
    period: formatPeriodParam(item),
    label: formatPeriodLabel(item, 'short'),
    spending: 0,
    income: 0,
  }));
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
  let excludedCount = 0;

  for (const row of rows) {
    const isCurrent = currentParams.includes(row.period);
    if (row.side === 'excluded') {
      excludedCount += isCurrent ? row.transactionCount : 0;
      continue;
    }

    const rate = mapper[row.currency];
    if (!rate) {
      throw new MissingExchangeRateError(row.currency);
    }
    // Spending is positive, so a category's refunds lower it
    const amount = row.amount * rate * (row.side === 'spending' ? -1 : 1);
    const chartItem = chart.find((item) => item.period === row.period);
    if (chartItem) {
      chartItem[row.side] += amount;
    }
    if (!isCurrent && !previousParams.includes(row.period)) {
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
        merchant: row.merchant,
        category: row.merchantCategory,
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
