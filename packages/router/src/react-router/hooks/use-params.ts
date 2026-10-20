import { useParams as useRouterParams } from 'react-router';

import type { Params, Path } from '../../types.ts';

/**
 * React Router's `useParams`, typed by the current route's path pattern.
 *
 * ```ts
 * const { id } = useParams('/posts/:id');
 * ```
 */
export default function useParams<P extends Path>(_path: P): Params<P> {
  // The path argument only selects the type; React Router owns the runtime values.
  return useRouterParams() as Params<P>;
}
