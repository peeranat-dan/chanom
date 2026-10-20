import type { NavigateOptions } from 'react-router';

import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router';

import type { HrefArgs, HrefOptions, Path } from '../types.ts';

import { href } from '../href.ts';

export interface Navigate {
  <P extends Path>(to: P, ...args: HrefArgs<NoInfer<P>, NavigateOptions>): void | Promise<void>;
  /** Moves through history, e.g. `navigate(-1)` to go back. */
  (delta: number): void | Promise<void>;
}

/**
 * React Router's `useNavigate` with a type-checked path and typed `params`.
 *
 * ```ts
 * const navigate = useNavigate();
 * navigate('/posts/:id', { params: { id: '1' }, replace: true });
 * ```
 */
export function useNavigate(): Navigate {
  const navigate = useRouterNavigate();
  return useCallback(
    (to: Path | number, options?: HrefOptions<Path> & NavigateOptions) => {
      if (typeof to === 'number') return navigate(to);
      const { params, search, hash, ...navigateOptions } = options ?? {};
      // HrefOptions<P> is conditional on P, so rebuild the options from their already-checked parts.
      return navigate(
        href<Path>(to, { params, search, hash } as HrefOptions<Path>),
        navigateOptions,
      );
    },
    [navigate],
  ) as Navigate;
}
