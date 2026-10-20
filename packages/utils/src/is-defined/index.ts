/**
 * Type guard for anything that is not `null` or `undefined`, handy for
 * `items.filter(isDefined)` to narrow `(T | undefined)[]` to `T[]`.
 */
export default function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
