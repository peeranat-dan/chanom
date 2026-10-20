import { describe, expect, it } from 'vitest';

import { collectPaths } from '../../src/core/collect-paths.ts';
import { scanPages } from '../../src/core/scan-pages.ts';

describe('collectPaths', () => {
  it('lists every navigable pattern, sorted', () => {
    const tree = scanPages(
      [
        '_app.tsx',
        '404.tsx',
        'index.tsx',
        'about.tsx',
        'posts/_layout.tsx',
        'posts/index.tsx',
        'posts/[id].tsx',
        '(auth)/login.tsx',
        '-[lang]/docs/index.tsx',
        'files/[...path].tsx',
      ],
      '',
    );

    expect(collectPaths(tree)).toEqual([
      '/',
      '/:lang?/docs',
      '/about',
      '/files/*',
      '/login',
      '/posts',
      '/posts/:id',
    ]);
  });

  it('is empty without pages', () => {
    expect(collectPaths(scanPages([], ''))).toEqual([]);
  });
});
