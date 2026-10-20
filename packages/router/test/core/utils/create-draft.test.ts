import { describe, expect, it } from 'vitest';

import createDraft from '../../../src/core/utils/create-draft.ts';

describe('createDraft', () => {
  it('starts with no pages or folders', () => {
    expect(createDraft()).toEqual({ pages: new Map(), dirs: new Map() });
  });

  it('returns a fresh draft each time', () => {
    expect(createDraft().pages).not.toBe(createDraft().pages);
  });
});
