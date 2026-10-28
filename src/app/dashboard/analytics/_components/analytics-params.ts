import { AnalyticsSide } from '@/lib/types/analytics.types';

export interface AnalyticsParams {
  /** Like "2026-10" or "2026" */
  period: string;
  view: AnalyticsSide;
  /** The transactions shown in the sheet: a category ID or "uncategorized", a merchant, or the excluded ones */
  category?: string;
  merchant?: string;
  excluded?: boolean;
}

export function getAnalyticsHref({ period, view, category, merchant, excluded }: AnalyticsParams) {
  const params = new URLSearchParams({ period });
  if (view === 'income') params.set('view', view);
  if (category) params.set('category', category);
  if (merchant) params.set('merchant', merchant);
  if (excluded) params.set('excluded', '1');
  return `/dashboard/analytics?${params}`;
}
