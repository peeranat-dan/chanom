import extractQueryString from './utils/extract-query-string.ts';

export type QueryParams = Readonly<Record<string, string | readonly string[]>>;

/**
 * Resolve a URL's query parameters into a plain object. Repeated keys collect
 * into an array (`?tag=a&tag=b -> { tag: ['a', 'b'] }`); single keys stay strings.
 */
export default function getQueryParams(url: string | URL): QueryParams {
  const search = typeof url === 'string' ? extractQueryString(url) : url.search;
  const searchParams = new URLSearchParams(search);
  const params: Record<string, string | readonly string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    const [first] = values;
    params[key] = values.length === 1 && first !== undefined ? first : values;
  }
  return params;
}
