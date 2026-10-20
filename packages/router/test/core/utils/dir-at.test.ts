import { describe, expect, it } from 'vitest';

import createDraft from '../../../src/core/utils/create-draft.ts';
import dirAt from '../../../src/core/utils/dir-at.ts';

describe('dirAt', () => {
  it('creates missing folders along the way', () => {
    const root = createDraft();

    const dir = dirAt(root, ['posts', '[id]']);

    expect(root.dirs.get('posts')?.dirs.get('[id]')).toBe(dir);
  });

  it('reuses existing folders', () => {
    const root = createDraft();

    expect(dirAt(root, ['posts'])).toBe(dirAt(root, ['posts']));
  });

  it('is the root for no parts', () => {
    const root = createDraft();

    expect(dirAt(root, [])).toBe(root);
  });
});
