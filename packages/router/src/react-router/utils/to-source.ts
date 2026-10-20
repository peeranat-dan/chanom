import type { RouteModule, RouteSource } from '../types.ts';

import once from './once.ts';
import toRouteProps from './to-route-props.ts';

/** Turns one `import.meta.glob` entry into route properties: lazy for importers, direct for eager modules. */
export default function toSource(entry: unknown): RouteSource {
  if (typeof entry === 'function') {
    // import.meta.glob types its importers as `() => Promise<unknown>`; the module shape is a page contract.
    const load = once(entry as () => Promise<RouteModule>);
    return { lazy: async () => toRouteProps(await load()) };
  }
  // Eager glob entries are the page modules themselves.
  if (typeof entry === 'object' && entry !== null) return toRouteProps(entry as RouteModule);
  return {};
}
