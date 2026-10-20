import { describe, expect, it } from 'vitest';

import preserveFocus from '../../../src/copy-to-clipboard/utils/preserve-focus.ts';
import { fakeFocusable, stubDocument } from '../../support/browser.ts';

describe('preserveFocus', () => {
  it('refocuses the previously active element without scrolling', () => {
    const fakeDocument = stubDocument();
    const input = fakeFocusable();
    fakeDocument.setActiveElement(input);

    const restore = preserveFocus();
    fakeDocument.setActiveElement(null);
    restore();

    expect(input.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
  });

  it('restores every saved selection range in order', () => {
    const fakeDocument = stubDocument();
    fakeDocument.selection.addRange('first');
    fakeDocument.selection.addRange('second');

    const restore = preserveFocus();
    fakeDocument.selection.removeAllRanges();
    restore();

    expect(fakeDocument.selection.rangeCount).toBe(2);
    expect([0, 1].map((index) => fakeDocument.selection.getRangeAt(index))).toEqual([
      'first',
      'second',
    ]);
  });

  it('leaves the selection alone when nothing was selected', () => {
    const fakeDocument = stubDocument();

    preserveFocus()();

    expect(fakeDocument.selection.removeAllRanges).not.toHaveBeenCalled();
  });

  it('skips focus when no element was active or it cannot take focus', () => {
    const fakeDocument = stubDocument();
    expect(() => preserveFocus()()).not.toThrow();

    fakeDocument.setActiveElement({} as ReturnType<typeof fakeFocusable>);
    expect(() => preserveFocus()()).not.toThrow();
  });
});
