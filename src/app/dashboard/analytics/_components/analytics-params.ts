export interface AnalyticsParams {
  /** Like "2026-10" or "2026" */
  period: string;
  /** The subaccounts it counts, else all */
  subaccountIds?: string[];
  /** Lists every transaction of the period, else the latest ones */
  allTransactions?: boolean;
}

export function getAnalyticsHref({ period, subaccountIds, allTransactions }: AnalyticsParams) {
  const params = new URLSearchParams({ period });
  if (subaccountIds?.length) params.set('subaccounts', subaccountIds.join(','));
  if (allTransactions) params.set('transactions', 'all');
  return `/dashboard/analytics?${params}`;
}
