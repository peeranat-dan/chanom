import type { NavigateOptions } from 'react-router';

import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router';

import type { HrefArgs, HrefOptions, Path } from '../../types.ts';

import toHref from '../utils/to-href.ts';

export interface NavigateFunction {
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
export default function useNavigate(): NavigateFunction {
  const navigate = useRouterNavigate();
  return useCallback(
    (to: Path | number, options?: HrefOptions<Path> & NavigateOptions) => {
      if (typeof to === 'number') return navigate(to);
      const { params, search, hash, ...navigateOptions } = options ?? {};
      return navigate(toHref(to, { params, search, hash }), navigateOptions);
    },
    [navigate],
    // The implementation accepts the union of both overloads, which TypeScript cannot infer from a lambda.
  ) as NavigateFunction;
}
