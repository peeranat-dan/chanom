import { describe, expect, it } from 'vitest';

import createDraft from '../../../src/core/utils/create-draft.ts';
import dirAt from '../../../src/core/utils/dir-at.ts';
import finalizeDir from '../../../src/core/utils/finalize-dir.ts';

describe('finalizeDir', () => {
  it('converts page and folder names into path segments', () => {
    const root = createDraft();
    root.pages.set('[id]', 'id.tsx');
    dirAt(root, ['(auth)']).pages.set('login', 'login.tsx');

    expect(finalizeDir(root, undefined)).toEqual({
      path: undefined,
      layout: undefined,
      index: undefined,
      pages: [{ path: ':id', file: 'id.tsx' }],
      dirs: [
        {
          path: undefined,
          layout: undefined,
          index: undefined,
          pages: [{ path: 'login', file: 'login.tsx' }],
          dirs: [],
        },
      ],
    });
  });

  it('makes name.tsx the index of a sibling name/ folder without one', () => {
    const root = createDraft();
    root.pages.set('posts', 'posts.tsx');
    dirAt(root, ['posts']).pages.set('[id]', 'id.tsx');

    const dir = finalizeDir(root, undefined);

    expect(dir.pages).toEqual([]);
    expect(dir.dirs[0]?.index).toBe('posts.tsx');
  });

  it('keeps name.tsx as a page when the sibling folder has its own index', () => {
    const root = createDraft();
    root.pages.set('posts', 'posts.tsx');
    dirAt(root, ['posts']).index = 'posts/index.tsx';

    expect(finalizeDir(root, undefined).pages).toEqual([{ path: 'posts', file: 'posts.tsx' }]);
  });
});
