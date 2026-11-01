import { AnalyticsSide } from '@/lib/types/analytics.types';

export interface AnalyticsParams {
  /** Like "2026-10" or "2026", else the last 12 months */
  period?: string;
  view: AnalyticsSide;
  /** Shows the transactions excluded from analytics in a sheet */
  excluded?: boolean;
}

export function getAnalyticsHref({ period, view, excluded }: AnalyticsParams) {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (view === 'income') params.set('view', view);
  if (excluded) params.set('excluded', '1');
  return `/dashboard/analytics?${params}`;
}
