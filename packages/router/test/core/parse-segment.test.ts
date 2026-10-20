import { describe, expect, it } from 'vitest';

import parseSegment from '../../src/core/parse-segment.ts';

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
