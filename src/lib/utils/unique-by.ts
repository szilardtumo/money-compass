export function uniqueBy<T, K>(array: T[], getKey: (item: T) => K): T[] {
  const seen = new Map<K, T>();

  for (const item of array) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}
