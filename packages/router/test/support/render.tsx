import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';

// React only enables act() warnings-free updates when this flag is set.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

export interface Rendered {
  readonly container: HTMLElement;
  readonly router: ReturnType<typeof createMemoryRouter>;
}

/** Renders `routes` in a memory router at `path` and waits for lazy routes to settle. */
export async function renderRoutes(routes: RouteObject[], path = '/'): Promise<Rendered> {
  const container = document.createElement('div');
  document.body.append(container);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await act(async () => {
    createRoot(container).render(<RouterProvider router={router} />);
  });
  await settle();
  return { container, router };
}

/** Renders `element` as the only route at `path`. */
export function renderAt(
  element: ReactNode,
  path = '/',
  extra: RouteObject[] = [],
): Promise<Rendered> {
  return renderRoutes([{ path: '*', element }, ...extra], path);
}

/** Flushes pending lazy imports, loaders, and the resulting renders. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  }
}
