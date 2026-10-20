/** Fills a path pattern's `:params` and `*` splat, URL-encoding every value. */
export default function buildPathname(
  pattern: string,
  params: Readonly<Record<string, string | undefined>>,
): string {
  const parts: string[] = [];
  for (const segment of pattern.split('/')) {
    if (segment === '') continue;
    if (segment === '*') {
      const splat = params['*'];
      if (splat) parts.push(...splat.split('/').filter(Boolean).map(encodeURIComponent));
    } else if (segment.startsWith(':')) {
      const optional = segment.endsWith('?');
      const name = segment.slice(1, optional ? -1 : undefined);
      const value = params[name];
      if (value !== undefined && value !== '') parts.push(encodeURIComponent(value));
      else if (!optional) throw new Error(`Missing param "${name}" for path "${pattern}"`);
    } else {
      parts.push(segment);
    }
  }
  return `/${parts.join('/')}`;
}
