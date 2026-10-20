/** Copy `source` without `keys`. Symbol keys are kept unless listed in `keys`. */
export default function omit<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Omit<T, K> {
  // Spread copies own enumerable string *and* symbol keys, unlike Object.entries.
  const copy: Partial<T> = { ...source };
  for (const key of keys) {
    delete copy[key];
  }
  // Every key in `keys` was deleted above, which is exactly the Omit shape.
  return copy as Omit<T, K>;
}
