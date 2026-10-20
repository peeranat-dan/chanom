import type { HrefArgs, Path, SearchInit } from './types.ts';

/**
 * Builds a URL from a registered path pattern, filling in its params.
 *
 * ```ts
 * href('/posts/:id', { params: { id: '1' }, search: { tab: 'comments' } }); // '/posts/1?tab=comments'
 * ```
 */
export function href<P extends Path>(to: P, ...[options]: HrefArgs<NoInfer<P>>): string {
  const params: Readonly<Record<string, string | undefined>> = options?.params ?? {};
  return buildPathname(to, params) + toSearch(options?.search) + toHash(options?.hash);
}

function buildPathname(
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

function toSearch(search: SearchInit | undefined): string {
  if (search === undefined) return '';
  if (typeof search === 'string')
    return search === '' || search.startsWith('?') ? search : `?${search}`;

  const query = new URLSearchParams(search instanceof URLSearchParams ? search : undefined);
  if (!(search instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(search)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== undefined && item !== null) query.append(key, String(item));
      }
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function toHash(hash: string | undefined): string {
  if (!hash) return '';
  return hash.startsWith('#') ? hash : `#${hash}`;
}
