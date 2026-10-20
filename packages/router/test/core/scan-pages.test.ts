import { describe, expect, it } from 'vitest';

import { commonDir, scanPages } from '../../src/core/scan-pages.ts';

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

  it('gives (group) folders no path', () => {
    const tree = scanPages(['./pages/index.tsx', './pages/(auth)/login.tsx']);

    expect(tree.root.dirs[0]?.path).toBeUndefined();
    expect(tree.root.dirs[0]?.pages).toEqual([{ path: 'login', file: './pages/(auth)/login.tsx' }]);
  });

  it('ignores underscore-prefixed files and folders', () => {
    const tree = scanPages([
      './pages/index.tsx',
      './pages/_components/button.tsx',
      './pages/posts/_card.tsx',
    ]);

    expect(tree.root.dirs).toEqual([]);
  });

  it('makes name.tsx the index of a sibling name/ folder without one', () => {
    const tree = scanPages(['./pages/posts.tsx', './pages/posts/[id].tsx']);

    expect(tree.root.pages).toEqual([]);
    expect(tree.root.dirs[0]?.index).toBe('./pages/posts.tsx');
  });

  it('keeps name.tsx as a page when the sibling folder has its own index', () => {
    const tree = scanPages(['./pages/posts.tsx', './pages/posts/index.tsx']);

    expect(tree.root.pages).toEqual([{ path: 'posts', file: './pages/posts.tsx' }]);
  });

  it('uses an explicit root instead of the common folder', () => {
    const tree = scanPages(['/src/pages/blog/index.tsx'], '/src/pages/');

    expect(tree.root.dirs[0]?.path).toBe('blog');
  });
});

describe('commonDir', () => {
  it('finds the shared folder prefix', () => {
    expect(commonDir(['./pages/index.tsx', './pages/posts/[id].tsx'])).toBe('./pages/');
  });

  it('is the file folder for a single file', () => {
    expect(commonDir(['/src/pages/index.tsx'])).toBe('/src/pages/');
  });

  it('does not split folder names that share a prefix', () => {
    expect(commonDir(['./pages/a/x.tsx', './pages/ab/y.tsx'])).toBe('./pages/');
  });

  it('is empty without files', () => {
    expect(commonDir([])).toBe('');
  });
});
