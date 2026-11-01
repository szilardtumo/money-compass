import { AnalyticsSide } from '@/lib/types/analytics.types';

export interface AnalyticsParams {
  /** Like "2026-10" or "2026" */
  period: string;
  view: AnalyticsSide;
  /** The subaccounts it counts, else all */
  subaccountIds?: string[];
  /** Shows the transactions excluded from analytics in a sheet */
  excluded?: boolean;
}

export function getAnalyticsHref({ period, view, subaccountIds, excluded }: AnalyticsParams) {
  const params = new URLSearchParams({ period });
  if (subaccountIds?.length) params.set('subaccounts', subaccountIds.join(','));
  if (view === 'income') params.set('view', view);
  if (excluded) params.set('excluded', '1');
  return `/dashboard/analytics?${params}`;
}
