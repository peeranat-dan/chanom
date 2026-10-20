import type { HrefArgs, Path } from '../types.ts';

import buildPathname from './utils/build-pathname.ts';
import toHash from './utils/to-hash.ts';
import toSearch from './utils/to-search.ts';

/**
 * Builds a URL from a registered path pattern, filling in its params.
 *
 * ```ts
 * href('/posts/:id', { params: { id: '1' }, search: { tab: 'comments' } }); // '/posts/1?tab=comments'
 * ```
 */
export default function href<P extends Path>(to: P, ...[options]: HrefArgs<NoInfer<P>>): string {
  const params: Readonly<Record<string, string | undefined>> = options?.params ?? {};
  return buildPathname(to, params) + toSearch(options?.search) + toHash(options?.hash);
}
