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
  /** The periods up to the selected one, oldest first */
  chart: ({ period: string; label: string } & Record<AnalyticsSide, number>)[];
  categories: Record<AnalyticsSide, (AnalyticsTotal & { category: Category | null })[]>;
  merchants: Record<
    AnalyticsSide,
    (AnalyticsTotal & { merchant: { id: string; name: string }; category: Category | null })[]
  >;
  excludedCount: number;
}
