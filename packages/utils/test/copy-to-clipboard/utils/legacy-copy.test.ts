import { describe, expect, it } from 'vitest';

import legacyCopy from '../../../src/copy-to-clipboard/utils/legacy-copy.ts';
import { stubDocument } from '../../support/browser.ts';

describe('legacyCopy', () => {
  it('copies through a temporary textarea and removes it afterwards', () => {
    const fakeDocument = stubDocument();

    expect(legacyCopy('hello')).toBe(true);
    expect(fakeDocument.appended).toHaveLength(1);
    expect(fakeDocument.appended[0]?.value).toBe('hello');
    expect(fakeDocument.removed).toEqual(fakeDocument.appended);
  });

  it('returns false when execCommand reports failure', () => {
    const fakeDocument = stubDocument();
    fakeDocument.execCommand.mockReturnValue(false);

    expect(legacyCopy('hello')).toBe(false);
    expect(fakeDocument.removed).toHaveLength(1);
  });

  it('returns false and still cleans up when execCommand throws', () => {
    const fakeDocument = stubDocument();
    fakeDocument.execCommand.mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(legacyCopy('hello')).toBe(false);
    expect(fakeDocument.removed).toHaveLength(1);
  });
});
