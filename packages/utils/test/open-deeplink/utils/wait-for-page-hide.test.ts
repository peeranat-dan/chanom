import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import waitForPageHide from '../../../src/open-deeplink/utils/wait-for-page-hide.ts';
import { stubBrowser } from '../../support/browser.ts';

describe('waitForPageHide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves true as soon as the document becomes hidden', async () => {
    const browser = stubBrowser();
    const result = waitForPageHide(1000);

    browser.hidePage();

    await expect(result).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('resolves true on pagehide', async () => {
    const browser = stubBrowser();
    const result = waitForPageHide(1000);

    browser.firePageHide();

    await expect(result).resolves.toBe(true);
  });

  it('resolves false when the page stays visible until the timeout', async () => {
    stubBrowser();
    const result = waitForPageHide(1000);

    await vi.advanceTimersByTimeAsync(999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toBe(false);
  });

  it('ignores visibilitychange events that leave the page visible', async () => {
    stubBrowser();
    const result = waitForPageHide(1000);

    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe(false);
  });
});
