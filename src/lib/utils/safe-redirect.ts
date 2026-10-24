/**
 * Returns `next` if it is a path on this site, so a `?next=` parameter can't redirect to another origin.
 */
export function getSafeRedirectPath(next: string | null, fallback = '/dashboard') {
  return next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : fallback;
}
