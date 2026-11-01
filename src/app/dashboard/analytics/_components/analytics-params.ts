import { AnalyticsSide } from '@/lib/types/analytics.types';

export interface AnalyticsParams {
  /** Like "2026-10" or "2026" */
  period: string;
  view: AnalyticsSide;
  /** The subaccounts it counts, else all */
  subaccountIds?: string[];
}

export function getAnalyticsHref({ period, view, subaccountIds }: AnalyticsParams) {
  const params = new URLSearchParams({ period });
  if (subaccountIds?.length) params.set('subaccounts', subaccountIds.join(','));
  if (view === 'income') params.set('view', view);
  return `/dashboard/analytics?${params}`;
}
