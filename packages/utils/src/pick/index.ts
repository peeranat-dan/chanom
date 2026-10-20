/** Copy only `keys` from `source`; keys missing from `source` are skipped. */
export default function pick<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const picked: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in source) {
      picked[key] = source[key];
    }
  }
  // Every requested key that exists on `source` was copied above.
  return picked as Pick<T, K>;
}
