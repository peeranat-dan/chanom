import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

// @vitest-environment jsdom
import type { Navigate } from '../../src/hooks/use-navigate.ts';
import type {} from '../support/register.ts';

import { useNavigate } from '../../src/hooks/use-navigate.ts';
import { renderRoutes } from '../support/render.tsx';

afterEach(() => {
  document.body.innerHTML = '';
});

interface Harness {
  readonly navigate: Navigate;
  readonly location: () => string;
}

async function setup(): Promise<Harness> {
  const captured: Navigate[] = [];
  function Capture(): null {
    captured.push(useNavigate());
    return null;
  }
  const { router } = await renderRoutes([{ path: '*', element: <Capture /> }]);
  const [navigate] = captured;
  if (!navigate) throw new Error('useNavigate was not rendered');
  return {
    navigate,
    location: () => {
      const { pathname, search, hash } = router.state.location;
      return `${pathname}${search}${hash}`;
    },
  };
}

describe('useNavigate', () => {
  it('navigates to the built href with router options', async () => {
    const { navigate, location } = await setup();

    await act(async () =>
      navigate('/posts/:id', { params: { id: '3' }, search: { q: 'x' }, hash: 'h', replace: true }),
    );

    expect(location()).toBe('/posts/3?q=x#h');
  });

  it('moves through history with a number', async () => {
    const { navigate, location } = await setup();
    await act(async () => navigate('/about'));

    await act(async () => navigate(-1));

    expect(location()).toBe('/');
  });

  it('type-checks paths and params', async () => {
    const { navigate } = await setup();
    const check = (): void => {
      // @ts-expect-error unknown path
      void navigate('/missing');
      // @ts-expect-error missing required params
      void navigate('/posts/:id');
    };

    expect(check).toBeTypeOf('function');
  });
});
