import { afterEach, describe, expect, it } from 'vitest';

// @vitest-environment jsdom
import type {} from '../../support/register.ts';

import Navigate from '../../../src/react-router/components/navigate.tsx';
import { renderRoutes } from '../../support/render.tsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Navigate', () => {
  it('redirects to the built href', async () => {
    const { router } = await renderRoutes([
      {
        path: '/',
        element: <Navigate to="/posts/:id" params={{ id: '2' }} search="a=1" replace />,
      },
      { path: '/posts/:id', element: <p>post</p> },
    ]);

    expect(router.state.location.pathname).toBe('/posts/2');
    expect(router.state.location.search).toBe('?a=1');
  });
});
