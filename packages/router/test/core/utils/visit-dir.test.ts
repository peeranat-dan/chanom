import { describe, expect, it } from 'vitest';

import visitDir from '../../../src/core/utils/visit-dir.ts';

describe('visitDir', () => {
  it('adds index, page, and nested paths below the parents', () => {
    const paths = new Set<string>();

    visitDir(
      {
        path: 'docs',
        layout: undefined,
        index: 'docs.tsx',
        pages: [{ path: ':slug', file: 'slug.tsx' }],
        dirs: [
          {
            path: undefined,
            layout: 'l.tsx',
            index: undefined,
            pages: [{ path: 'faq', file: 'faq.tsx' }],
            dirs: [],
          },
        ],
      },
      [':lang?'],
      paths,
    );

    expect([...paths]).toEqual(['/:lang?/docs', '/:lang?/docs/:slug', '/:lang?/docs/faq']);
  });
});
