/**
 * Pull the query string out of an absolute URL, a relative path, or a bare
 * `?a=1` string. Anything after the next `#` is dropped, so hash-router URLs
 * like `/#/page?a=1` still yield `a=1`.
 */
export default function extractQueryString(url: string): string {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    return '';
  }
  const query = url.slice(queryStart + 1);
  const hashStart = query.indexOf('#');
  return hashStart === -1 ? query : query.slice(0, hashStart);
}
