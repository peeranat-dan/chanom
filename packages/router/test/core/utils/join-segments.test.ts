import { describe, expect, it } from 'vitest';

import joinSegments from '../../../src/core/utils/join-segments.ts';

describe('joinSegments', () => {
  it('joins segments into an absolute path', () => {
    expect(joinSegments(['posts', ':id'])).toBe('/posts/:id');
  });

  it('skips empty segments and is / without any', () => {
    expect(joinSegments(['', 'about'])).toBe('/about');
    expect(joinSegments([])).toBe('/');
  });
});
