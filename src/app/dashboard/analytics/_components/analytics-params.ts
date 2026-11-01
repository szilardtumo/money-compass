export interface AnalyticsParams {
  /** Like "2026-10" or "2026" */
  period: string;
  /** The subaccounts it counts, else all */
  subaccountIds?: string[];
}

export function getAnalyticsHref({ period, subaccountIds }: AnalyticsParams) {
  const params = new URLSearchParams({ period });
  if (subaccountIds?.length) params.set('subaccounts', subaccountIds.join(','));
  return `/dashboard/analytics?${params}`;
}
