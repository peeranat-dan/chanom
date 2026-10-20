import { redirect as routerRedirect } from 'react-router';

import type { HrefArgs, HrefOptions, Path } from './types.ts';

import { href } from './href.ts';

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
export function redirect<P extends Path>(
  to: P,
  ...[options]: HrefArgs<NoInfer<P>, RedirectInit>
): Response {
  const { init, ...hrefOptions } = options ?? {};
  // HrefOptions<P> is conditional on P, so rebuild the options from their already-checked parts.
  return routerRedirect(href<Path>(to, hrefOptions as HrefOptions<Path>), init);
}
