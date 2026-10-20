import { describe, expect, it } from 'vitest';

import type { PageDir } from '../../../src/core/types.ts';

import toRoutes from '../../../src/react-router/utils/to-routes.ts';

function dir(partial: Partial<PageDir>): PageDir {
  return { path: undefined, layout: undefined, index: undefined, pages: [], dirs: [], ...partial };
}

const source = (file: string | undefined): { handle?: string } =>
  file === undefined ? {} : { handle: file };

describe('toRoutes', () => {
  it('makes index and page routes', () => {
    expect(toRoutes(dir({ index: 'i', pages: [{ path: 'about', file: 'a' }] }), source)).toEqual([
      { index: true, handle: 'i' },
      { path: 'about', handle: 'a' },
    ]);
  });

  it('flattens layout-less folders into prefixed paths', () => {
    const tree = dir({
      dirs: [
        dir({
          path: 'docs',
          index: 'd',
          dirs: [dir({ pages: [{ path: ':slug', file: 's' }] })],
        }),
      ],
    });

    expect(toRoutes(tree, source)).toEqual([
      { path: 'docs', handle: 'd' },
      { path: 'docs/:slug', handle: 's' },
    ]);
  });

  it('nests folders with a layout, pathless for groups', () => {
    const tree = dir({
      dirs: [
        dir({ path: 'posts', layout: 'pl', index: 'pi' }),
        dir({ layout: 'gl', pages: [{ path: 'login', file: 'l' }] }),
      ],
    });

    expect(toRoutes(tree, source)).toEqual([
      { path: 'posts', handle: 'pl', children: [{ index: true, handle: 'pi' }] },
      { path: undefined, handle: 'gl', children: [{ path: 'login', handle: 'l' }] },
    ]);
  });
});
