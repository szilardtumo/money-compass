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

/** The sum of transactions of a day, month or year, by where they count, category and merchant */
export interface TransactionTotal {
  /** Like "2026-10-05", "2026-10" or "2026" */
  bucket: string;
  side: AnalyticsSide | 'excluded';
  category: Category | null;
  /** With its own category, which isn't always the transactions' */
  merchant: { id: string; name: string; category: Category | null } | null;
  /** In the main currency, negative for spending */
  amount: number;
  transactionCount: number;
}
