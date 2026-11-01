import 'server-only';

import { and, count, eq, gte, inArray, lt, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Analytics, AnalyticsSide, AnalyticsTotal } from '@/lib/types/analytics.types';
import {
  formatPeriodLabel,
  formatPeriodParam,
  getChartMonths,
  getPeriodRange,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';
import { schema } from '@/server/db';

import {
  analyticsSide,
  categoryColumns,
  joinCategory,
  transactionMonth,
} from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

const t = schema.transactions;

/**
 * Returns the spending and income of a period by category and merchant, compared to the period
 * before, and the totals of its year's months or of the years up to it for a chart, and the daily spending of its month and the one before. Amounts are in the main currency.
 *
 * @param input.period Like "2026-10" for a month or "2026" for a year
 * @param input.subaccountIds Only the transactions of these subaccounts, else of all
 */
export const getAnalytics = createApiQuery<{ period: string; subaccountIds?: string[] }, Analytics>(
  async ({ input }) => {
    'use cache: private';
    const { db } = await createApiContext();

    const period = parsePeriod(input.period);
    const previous = shiftPeriod(period, -1);
    const chartPeriods =
      period.unit === 'year'
        ? Array.from({ length: 5 }, (_, index) => shiftPeriod(period, index - 4))
        : getChartMonths(input.period).map((month) => parsePeriod(month));
    const ranges = [...chartPeriods, previous].map(getPeriodRange);
    const start = new Date(Math.min(...ranges.map((range) => range.start.getTime())));
    const end = new Date(Math.max(...ranges.map((range) => range.end.getTime())));
    // The merchant's own category, while the side follows each transaction's category
    const merchantCategory = alias(schema.categories, 'merchant_category');
    const bucket = sql<string>`to_char(date_trunc(${period.unit}, ${t.startedDate} at time zone 'UTC'), ${period.unit === 'month' ? 'YYYY-MM' : 'YYYY'})`;
    const inSubaccounts = input.subaccountIds?.length
      ? inArray(t.subaccountId, input.subaccountIds)
      : undefined;
    const paceMonths = period.unit === 'month' ? [previous, period] : [];

    const [rows, paceRows, { mainCurrency, mapper }] = await Promise.all([
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
          .where(and(gte(t.startedDate, start), lt(t.startedDate, end), inSubaccounts))
          .groupBy(
            sql`period`,
            sql`side`,
            schema.categories.id,
            schema.merchants.id,
            merchantCategory.id,
            schema.subaccounts.currency,
          ),
      ),
      paceMonths.length
        ? db.rls((tx) =>
            joinCategory(
              tx
                .select({
                  day: sql<string>`to_char(${t.startedDate} at time zone 'UTC', 'YYYY-MM-DD')`.as(
                    'day',
                  ),
                  currency: schema.subaccounts.currency,
                  amount: sum(t.amount).mapWith(Number),
                })
                .from(t)
                .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
                .$dynamic(),
            )
              .where(
                and(
                  gte(t.startedDate, getPeriodRange(paceMonths[0]).start),
                  lt(t.startedDate, getPeriodRange(period).end),
                  inSubaccounts,
                  sql`${analyticsSide} = 'spending'`,
                ),
              )
              .groupBy(sql`day`, schema.subaccounts.currency),
          )
        : [],
      getMainCurrencyWithMapper(),
    ]);

    const currentParam = formatPeriodParam(period);
    const previousParam = formatPeriodParam(previous);
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
      const isCurrent = row.period === currentParam;
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
      if (!isCurrent && row.period !== previousParam) {
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

    // The running total of each day of the months, until today
    const today = new Date().toISOString().slice(0, 10);
    const [previousDays, days] = paceMonths.map((month) => {
      const param = formatPeriodParam(month);
      let total = 0;
      return Array.from(
        { length: new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate() },
        (_, index) => {
          const day = `${param}-${String(index + 1).padStart(2, '0')}`;
          for (const row of paceRows) {
            if (row.day === day) {
              total -= row.amount * (mapper[row.currency] ?? 0);
            }
          }
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
      excludedCount,
      pace: days ? { month: formatPeriodParam(period), days, previousDays } : null,
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
  const { db } = await createApiContext();
  const now = parsePeriod(undefined);
  const months = Array.from({ length: 13 }, (_, index) => shiftPeriod(now, index - 12));

  const [rows, { mainCurrency, mapper }] = await Promise.all([
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            month: transactionMonth.as('month'),
            side: analyticsSide.as('side'),
            currency: schema.subaccounts.currency,
            amount: sum(t.amount).mapWith(Number),
          })
          .from(t)
          .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
          .$dynamic(),
      )
        .where(gte(t.startedDate, getPeriodRange(months[0]).start))
        .groupBy(sql`month`, sql`side`, schema.subaccounts.currency),
    ),
    getMainCurrencyWithMapper(),
  ]);

  return {
    mainCurrency,
    months: months.map((period) => {
      const month = formatPeriodParam(period);
      const totals = { month, spending: 0, income: 0 };
      for (const row of rows) {
        if (row.month === month && row.side !== 'excluded') {
          const rate = mapper[row.currency];
          if (!rate) {
            throw new MissingExchangeRateError(row.currency);
          }
          totals[row.side] += row.amount * rate * (row.side === 'spending' ? -1 : 1);
        }
      }
      return totals;
    }),
  };
});
