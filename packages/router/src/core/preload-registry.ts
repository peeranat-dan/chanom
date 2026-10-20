import type { RouteObject } from 'react-router';

import { matchRoutes, parsePath } from 'react-router';

let registered: readonly RouteObject[] = [];

/** Called by `createRoutes` so `preload` and preloading links know the app's route tree. */
export function registerRoutes(routes: readonly RouteObject[]): void {
  registered = routes;
}

/**
 * Starts downloading the code of every route matching `to` (e.g. `/posts/1`).
 * Safe to call repeatedly: each page module is fetched at most once.
 */
export function preload(to: string): Promise<void> {
  const { pathname = '/' } = parsePath(to);
  const matches = matchRoutes([...registered], pathname) ?? [];
  const pending = matches.map(({ route }) =>
    typeof route.lazy === 'function' ? route.lazy() : undefined,
  );
  return Promise.all(pending).then(
    () => undefined,
    // A failed chunk is retried by React Router on navigation, so preloading stays silent.
    () => undefined,
  );
}
