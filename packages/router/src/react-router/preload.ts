import { matchRoutes, parsePath } from 'react-router';

import registeredRoutes from './utils/registered-routes.ts';

/**
 * Starts downloading the code of every route matching `to` (e.g. `/posts/1`).
 * Safe to call repeatedly: each page module is fetched at most once.
 */
export default function preload(to: string): Promise<void> {
  const { pathname = '/' } = parsePath(to);
  const matches = matchRoutes([...registeredRoutes.current], pathname) ?? [];
  const pending = matches.map(({ route }) =>
    typeof route.lazy === 'function' ? route.lazy() : undefined,
  );
  return Promise.all(pending).then(
    () => undefined,
    // A failed chunk is retried by React Router on navigation, so preloading stays silent.
    () => undefined,
  );
}
