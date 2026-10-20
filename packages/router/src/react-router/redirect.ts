import { redirect as routerRedirect } from 'react-router';

import type { HrefArgs, Path } from '../types.ts';

import toHref from './utils/to-href.ts';

interface RedirectInit {
  /** A status code or full `ResponseInit`. Defaults to 302. */
  readonly init?: number | ResponseInit;
}

/**
 * React Router's `redirect` for loaders and actions, with a type-checked path.
 *
 * ```ts
 * throw redirect('/login', { search: { next: request.url } });
 * ```
 */
export default function redirect<P extends Path>(
  to: P,
  ...[options]: HrefArgs<NoInfer<P>, RedirectInit>
): Response {
  return routerRedirect(toHref(to, options), options?.init);
}
