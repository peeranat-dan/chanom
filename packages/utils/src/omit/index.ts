/** Copy `source` without `keys`. */
export default function omit<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Omit<T, K> {
  const omitted = new Set<PropertyKey>(keys);
  // Object.fromEntries loses the key types; the filter guarantees the Omit shape.
  return Object.fromEntries(Object.entries(source).filter(([key]) => !omitted.has(key))) as Omit<
    T,
    K
  >;
}
