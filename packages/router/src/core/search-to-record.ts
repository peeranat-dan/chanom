/** Reads search params into a plain record; for a repeated key the first value wins, like `get`. */
export default function searchToRecord(
  params: URLSearchParams,
): Readonly<Record<string, string | undefined>> {
  // fromEntries defines keys as own properties, so names like `__proto__` stay plain data.
  return Object.fromEntries([...new Set(params.keys())].map((key) => [key, params.get(key) ?? '']));
}
