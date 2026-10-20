import { describe, expect, it } from 'vitest';

import scanPages from '../../src/core/scan-pages.ts';

describe('scanPages', () => {
  it('separates _app and 404 from the route tree', () => {
    const tree = scanPages(['./pages/_app.tsx', './pages/404.tsx', './pages/index.tsx']);

    expect(tree.app).toBe('./pages/_app.tsx');
    expect(tree.notFound).toBe('./pages/404.tsx');
    expect(tree.root).toEqual({
      path: undefined,
      layout: undefined,
      index: './pages/index.tsx',
      pages: [],
      dirs: [],
    });
  });

  it('nests folders with their layout, index, and pages', () => {
    const tree = scanPages([
      './pages/index.tsx',
      './pages/posts/_layout.tsx',
      './pages/posts/index.tsx',
      './pages/posts/[id].tsx',
    ]);

    expect(tree.root.dirs).toEqual([
      {
        path: 'posts',
        layout: './pages/posts/_layout.tsx',
        index: './pages/posts/index.tsx',
        pages: [{ path: ':id', file: './pages/posts/[id].tsx' }],
        dirs: [],
      },
    ]);
  });

  it('only treats _app and 404 as special at the root', () => {
    const tree = scanPages(['./pages/index.tsx', './pages/docs/404.tsx', './pages/docs/_app.tsx']);

    expect(tree.notFound).toBeUndefined();
    expect(tree.root.dirs[0]?.pages).toEqual([{ path: '404', file: './pages/docs/404.tsx' }]);
  });

  it('ignores underscore-prefixed files and folders', () => {
    const tree = scanPages([
      './pages/index.tsx',
      './pages/_components/button.tsx',
      './pages/posts/_card.tsx',
    ]);

    expect(tree.root.dirs).toEqual([]);
  });

  it('uses an explicit root instead of the common folder', () => {
    const tree = scanPages(['/src/pages/blog/index.tsx'], '/src/pages/');

    expect(tree.root.dirs[0]?.path).toBe('blog');
  });
});
