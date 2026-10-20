import { describe, expect, it } from 'vitest';

import joinPath from '../../../src/react-router/utils/join-path.ts';

describe('joinPath', () => {
  it('joins two paths with a slash', () => {
    expect(joinPath('docs', ':slug')).toBe('docs/:slug');
  });

  it('returns the other path when one is empty', () => {
    expect(joinPath('', 'about')).toBe('about');
    expect(joinPath('docs', '')).toBe('docs');
    expect(joinPath('', '')).toBe('');
  });
});
