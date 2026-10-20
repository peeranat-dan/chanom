import { describe, expect, it } from 'vitest';

import applySearchUpdate from '../../src/core/apply-search-update.ts';

describe('applySearchUpdate', () => {
  it('replaces updated keys and keeps the rest', () => {
    const current = new URLSearchParams('page=1&tag=a&tag=b&q=tea');

    expect(applySearchUpdate(current, { page: 2, tag: ['c'] }).toString()).toBe(
      'q=tea&page=2&tag=c',
    );
  });

  it('removes keys set to null or undefined', () => {
    const current = new URLSearchParams('page=1&q=tea');

    expect(applySearchUpdate(current, { page: null, q: undefined }).toString()).toBe('');
  });

  it('leaves the current params untouched', () => {
    const current = new URLSearchParams('page=1');
    applySearchUpdate(current, { page: 2 });

    expect(current.toString()).toBe('page=1');
  });
});
