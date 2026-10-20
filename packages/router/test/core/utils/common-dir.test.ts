import { describe, expect, it } from 'vitest';

import commonDir from '../../../src/core/utils/common-dir.ts';

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
