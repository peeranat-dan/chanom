export type DeeplinkParamValue = string | number | boolean;

export type DeeplinkParams = Readonly<
  Record<string, DeeplinkParamValue | readonly DeeplinkParamValue[] | undefined>
>;

/** Serialize params, skipping `undefined` values and repeating keys for arrays. */
export default function buildQueryString(params: DeeplinkParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    const values: readonly DeeplinkParamValue[] = Array.isArray(value) ? value : [value];
    for (const item of values) {
      searchParams.append(key, String(item));
    }
  }
  return searchParams.toString();
}
