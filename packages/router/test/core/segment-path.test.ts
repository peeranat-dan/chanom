import { describe, expect, it } from 'vitest';

import segmentPath from '../../src/core/segment-path.ts';

describe('segmentPath', () => {
  it('is the segment path', () => {
    expect(segmentPath({ kind: 'param', path: ':id' })).toBe(':id');
    expect(segmentPath({ kind: 'splat', path: '*' })).toBe('*');
  });

  it('is undefined for groups', () => {
    expect(segmentPath({ kind: 'group' })).toBeUndefined();
  });
});
