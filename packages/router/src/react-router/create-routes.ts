import type { RouteObject } from 'react-router';

import type { PageModules, RouteSource } from './types.ts';

import scanPages from '../core/scan-pages.ts';
import registerRoutes from './utils/register-routes.ts';
import renderNothing from './utils/render-nothing.ts';
import toRoutes from './utils/to-routes.ts';
import toSource from './utils/to-source.ts';

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
export default function createRoutes(
  pages: PageModules,
  options: CreateRoutesOptions = {},
): RouteObject[] {
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
