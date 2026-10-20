import type { DOMRouterOpts } from 'react-router';

import { createBrowserRouter } from 'react-router';

import type { CreateRoutesOptions } from './create-routes.ts';
import type { PageModules } from './types.ts';

import createRoutes from './create-routes.ts';

export interface CreateRouterOptions extends CreateRoutesOptions, DOMRouterOpts {}

/**
 * Creates a browser router from your pages folder.
 *
 * ```tsx
 * const router = createRouter(import.meta.glob('./pages/**\/*.tsx'));
 * createRoot(root).render(<RouterProvider router={router} />);
 * ```
 */
export default function createRouter(
  pages: PageModules,
  options: CreateRouterOptions = {},
): ReturnType<typeof createBrowserRouter> {
  const { root, fallback, ...routerOptions } = options;
  return createBrowserRouter(createRoutes(pages, { root, fallback }), routerOptions);
}
