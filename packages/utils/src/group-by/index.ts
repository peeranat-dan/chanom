/** Group `items` by the key `getKey` returns, keeping their original order. */
export default function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  getKey: (item: T, index: number) => K,
): Partial<Record<K, T[]>> {
  const groups: Partial<Record<K, T[]>> = {};
  items.forEach((item, index) => {
    const key = getKey(item, index);
    (groups[key] ??= []).push(item);
  });
  return groups;
}
