import { Category } from './categories.types';

export type AnalyticsSide = 'spending' | 'income';

export interface AnalyticsTotal {
  /** Spending as a positive number. Refunds lower it and can make it negative. */
  amount: number;
  previousAmount: number;
  transactionCount: number;
}

export interface Analytics {
  mainCurrency: string;
  /** The selected period and the one before it */
  totals: Record<AnalyticsSide, { amount: number; previousAmount: number }>;
  /** The months of the selected month's year, or the years up to the selected one, oldest first */
  chart: ({ period: string } & Record<AnalyticsSide, number>)[];
  categories: Record<AnalyticsSide, (AnalyticsTotal & { category: Category | null })[]>;
  merchants: Record<
    AnalyticsSide,
    (AnalyticsTotal & { merchant: { id: string; name: string }; category: Category | null })[]
  >;
  /** The running total of the month's spending per day, null after today, and of the month before */
  pace: { month: string; days: (number | null)[]; previousDays: (number | null)[] } | null;
}
