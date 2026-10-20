import type { DeeplinkParams } from './utils/build-query-string.ts';

import buildQueryString from './utils/build-query-string.ts';
import normalizePath from './utils/normalize-path.ts';
import normalizeScheme from './utils/normalize-scheme.ts';

export type { DeeplinkParams, DeeplinkParamValue } from './utils/build-query-string.ts';

export interface CreateDeeplinkOptions {
  /** App URL scheme: `myapp`, `myapp:`, and `myapp://` are all accepted. */
  readonly scheme: string;
  /** Path inside the app, e.g. `product/42`. Each segment is percent-encoded. */
  readonly path?: string;
  /** Query params; `undefined` values are skipped and arrays repeat the key. */
  readonly params?: DeeplinkParams;
}

/**
 * Build a custom-scheme deeplink into a native app, e.g.
 * `createDeeplink({ scheme: 'myapp', path: 'product/42', params: { ref: 'web' } })`
 * returns `'myapp://product/42?ref=web'`.
 */
export default function createDeeplink({
  scheme,
  path = '',
  params = {},
}: CreateDeeplinkOptions): string {
  const query = buildQueryString(params);
  return `${normalizeScheme(scheme)}://${normalizePath(path)}${query === '' ? '' : `?${query}`}`;
}
