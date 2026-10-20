import { describe, expect, it } from 'vitest';

import legacyCopy from '../../../src/copy-to-clipboard/utils/legacy-copy.ts';
import { fakeFocusable, stubDocument } from '../../support/browser.ts';

describe('legacyCopy', () => {
  it('copies through a temporary textarea and removes it afterwards', () => {
    const fakeDocument = stubDocument();

    expect(legacyCopy('hello')).toBe(true);
    expect(fakeDocument.execCommand).toHaveBeenCalledExactlyOnceWith('copy');
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

  it('returns false instead of throwing when the textarea cannot be created', () => {
    const fakeDocument = stubDocument();
    fakeDocument.createElement.mockImplementation(() => {
      throw new Error('no DOM');
    });

    expect(legacyCopy('hello')).toBe(false);
    expect(fakeDocument.execCommand).not.toHaveBeenCalled();
  });

  it('gives focus and selection back to what held them before', () => {
    const fakeDocument = stubDocument();
    const input = fakeFocusable();
    fakeDocument.setActiveElement(input);
    fakeDocument.selection.addRange('range');

    legacyCopy('hello');

    expect(input.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(fakeDocument.selection.rangeCount).toBe(1);
    expect(fakeDocument.selection.getRangeAt(0)).toBe('range');
  });
});
