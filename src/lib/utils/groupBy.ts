export function groupBy<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => string,
): Record<string, T[]> {
  return array.reduce(
    (acc, value, index, list) => {
      (acc[predicate(value, index, list)] ||= []).push(value);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}
