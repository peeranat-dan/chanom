import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

// @vitest-environment jsdom
import type { Params } from '../../src/types.ts';
import type {} from '../support/register.ts';

import { useParams } from '../../src/hooks/use-params.ts';
import { renderRoutes } from '../support/render.tsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useParams', () => {
  it('returns the params typed by the path pattern', async () => {
    const seen: Params<'/posts/:id'>[] = [];
    function Post(): null {
      const params = useParams('/posts/:id');
      expectTypeOf(params).toEqualTypeOf<{ readonly id: string }>();
      seen.push(params);
      return null;
    }

    await renderRoutes([{ path: '/posts/:id', element: <Post /> }], '/posts/9');

    expect(seen.at(-1)).toEqual({ id: '9' });
  });
});
