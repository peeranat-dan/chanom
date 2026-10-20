import { describe, expect, it } from 'vitest';

import copyToClipboard from '../../src/copy-to-clipboard/index.ts';
import { stubClipboard, stubDocument } from '../support/browser.ts';

describe('copyToClipboard', () => {
  it('uses the Clipboard API when available', async () => {
    const fakeDocument = stubDocument();
    const writeText = stubClipboard(async () => {});

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledExactlyOnceWith('hello');
    expect(fakeDocument.execCommand).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the Clipboard API is missing', async () => {
    const fakeDocument = stubDocument();
    stubClipboard();

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(fakeDocument.execCommand).toHaveBeenCalledExactlyOnceWith('copy');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    const fakeDocument = stubDocument();
    stubClipboard(async () => {
      throw new Error('denied');
    });

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(fakeDocument.execCommand).toHaveBeenCalledOnce();
  });

  it('resolves false outside the browser', async () => {
    await expect(copyToClipboard('hello')).resolves.toBe(false);
  });
});
