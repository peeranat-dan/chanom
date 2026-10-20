import { describe, expect, it } from 'vitest';

import { parseSegment, segmentPath } from '../../src/core/segment.ts';

describe('parseSegment', () => {
  it('keeps static names as-is', () => {
    expect(parseSegment('about')).toEqual({ kind: 'static', path: 'about' });
  });

  it('turns [name] into a required param', () => {
    expect(parseSegment('[id]')).toEqual({ kind: 'param', path: ':id' });
  });

  it('turns -[name] into an optional param', () => {
    expect(parseSegment('-[lang]')).toEqual({ kind: 'optional', path: ':lang?' });
  });

  it('turns [...name] into a splat', () => {
    expect(parseSegment('[...slug]')).toEqual({ kind: 'splat', path: '*' });
  });

  it('treats (name) as a pathless group', () => {
    expect(parseSegment('(auth)')).toEqual({ kind: 'group' });
  });
});

describe('segmentPath', () => {
  it('is undefined only for groups', () => {
    expect(segmentPath({ kind: 'group' })).toBeUndefined();
    expect(segmentPath({ kind: 'param', path: ':id' })).toBe(':id');
  });
});
