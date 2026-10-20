import type { HrefOptions, Path, SearchInit } from '../../types.ts';

import href from '../../core/href.ts';

interface LooseHrefOptions {
  readonly params?: unknown;
  readonly search?: SearchInit;
  readonly hash?: string;
}

/** `href` for callers that already type-checked `to` and its options against their own `P`. */
export default function toHref(to: Path, { params, search, hash }: LooseHrefOptions = {}): string {
  // HrefOptions<P> is conditional on P, so the checked parts are passed on as the widest options.
  return href<Path>(to, { params, search, hash } as HrefOptions<Path>);
}
