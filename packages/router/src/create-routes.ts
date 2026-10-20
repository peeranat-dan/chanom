import type { RouteObject } from 'react-router';

import type { PageDir } from './core/scan-pages.ts';
import type { PageModules, RouteModule } from './types.ts';

import { registerRoutes } from './core/preload-registry.ts';
import { toRouteProps } from './core/route-props.ts';
import { scanPages } from './core/scan-pages.ts';

type RouteSource = Pick<
  RouteObject,
  'lazy' | 'Component' | 'loader' | 'action' | 'ErrorBoundary' | 'handle' | 'shouldRevalidate'
>;

export interface CreateRoutesOptions {
  /**
   * Prefix stripped from every `import.meta.glob` key to get the page path.
   * Defaults to the longest folder prefix the keys share, e.g. `./pages/`.
   */
  readonly root?: string;
  /** Rendered while the first matched routes load. Defaults to rendering nothing. */
  readonly fallback?: RouteObject['HydrateFallback'];
}

/**
 * Builds React Router routes from the output of `import.meta.glob`. Lazy
 * importers become code-split routes; modules globbed with `{ eager: true }`
 * are attached directly.
 *
 * ```ts
 * const routes = createRoutes(import.meta.glob('./pages/**\/*.tsx'));
 * ```
 */
export function createRoutes(pages: PageModules, options: CreateRoutesOptions = {}): RouteObject[] {
  const tree = scanPages(Object.keys(pages), options.root);
  const source = (file: string | undefined): RouteSource =>
    file === undefined ? {} : toSource(pages[file]);

  const children = toRoutes(tree.root, source);
  const hasCatchAll = children.some((route) => route.path === '*');
  if (tree.notFound !== undefined && !hasCatchAll) {
    children.push({ path: '*', ...source(tree.notFound) });
  }

  const routes: RouteObject[] = [
    {
      path: '/',
      HydrateFallback: options.fallback ?? renderNothing,
      ...source(tree.app),
      children,
    },
  ];
  registerRoutes(routes);
  return routes;
}

/**
 * Folders without a `_layout` are flattened into their children's paths
 * (`posts/[id]` → `posts/:id`): fewer routes to match, and the bare folder
 * path falls through to 404 instead of rendering an empty outlet.
 */
function toRoutes(
  dir: PageDir,
  source: (file: string | undefined) => RouteSource,
  prefix = '',
): RouteObject[] {
  const routes: RouteObject[] = [];
  if (dir.index !== undefined) {
    routes.push(
      prefix ? { path: prefix, ...source(dir.index) } : { index: true, ...source(dir.index) },
    );
  }
  for (const page of dir.pages)
    routes.push({ path: joinPath(prefix, page.path), ...source(page.file) });

  for (const child of dir.dirs) {
    const path = joinPath(prefix, child.path ?? '');
    if (child.layout === undefined) routes.push(...toRoutes(child, source, path));
    else
      routes.push({
        path: path || undefined,
        ...source(child.layout),
        children: toRoutes(child, source),
      });
  }
  return routes;
}

function joinPath(parent: string, child: string): string {
  return parent && child ? `${parent}/${child}` : parent || child;
}

function toSource(entry: unknown): RouteSource {
  if (typeof entry === 'function') {
    // import.meta.glob types its importers as `() => Promise<unknown>`; the module shape is a page contract.
    const load = once(entry as () => Promise<RouteModule>);
    return { lazy: async () => toRouteProps(await load()) };
  }
  // Eager glob entries are the page modules themselves.
  if (typeof entry === 'object' && entry !== null) return toRouteProps(entry as RouteModule);
  return {};
}

/** Shares one in-flight import between preloading and navigation; forgets failures so a retry refetches. */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined;
  return () => {
    promise ??= load().catch((error: unknown) => {
      promise = undefined;
      throw error;
    });
    return promise;
  };
}

function renderNothing(): null {
  return null;
}
