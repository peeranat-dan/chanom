import type { RouteObject } from 'react-router';

import registeredRoutes from './registered-routes.ts';

/** Makes `routes` the tree that `preload` and preloading links match against. */
export default function registerRoutes(routes: readonly RouteObject[]): void {
  registeredRoutes.current = routes;
}
