import type { RouteObject } from 'react-router';

import type { PageDir } from '../../core/types.ts';
import type { RouteSource } from '../types.ts';

import joinPath from './join-path.ts';

/**
 * Converts a page folder into routes. Folders without a `_layout` are
 * flattened into their children's paths (`posts/[id]` → `posts/:id`): fewer
 * routes to match, and the bare folder path falls through to 404 instead of
 * rendering an empty outlet.
 */
export default function toRoutes(
  dir: PageDir,
  source: (file: string | undefined) => RouteSource,
  prefix = '',
): RouteObject[] {
  const routes: RouteObject[] = [];
  if (dir.index !== undefined) {
    const props = source(dir.index);
    routes.push(prefix ? { path: prefix, ...props } : { index: true, ...props });
  }
  for (const page of dir.pages) {
    routes.push({ path: joinPath(prefix, page.path), ...source(page.file) });
  }

  for (const child of dir.dirs) {
    const path = joinPath(prefix, child.path ?? '');
    if (child.layout === undefined) {
      routes.push(...toRoutes(child, source, path));
    } else {
      routes.push({
        path: path || undefined,
        ...source(child.layout),
        children: toRoutes(child, source),
      });
    }
  }
  return routes;
}
