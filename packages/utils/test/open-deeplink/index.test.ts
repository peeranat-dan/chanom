import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import openDeeplink from '../../src/open-deeplink/index.ts';
import { stubBrowser } from '../support/browser.ts';

describe('openDeeplink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves true and skips the fallback when the app opens', async () => {
    const browser = stubBrowser();
    const result = openDeeplink('myapp://home', { fallbackUrl: 'https://store.example' });

    expect(browser.location.href).toBe('myapp://home');
    browser.hidePage();
    await vi.advanceTimersByTimeAsync(5000);

    await expect(result).resolves.toBe(true);
    expect(browser.location.href).toBe('myapp://home');
  });

  it('navigates to the fallback after the timeout when the app does not open', async () => {
    const browser = stubBrowser();
    const result = openDeeplink('myapp://home', {
      fallbackUrl: 'https://store.example',
      timeout: 500,
    });

    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBe(false);
    expect(browser.location.href).toBe('https://store.example');
  });

  it('resolves false without a fallback when the app does not open', async () => {
    const browser = stubBrowser();
    const result = openDeeplink('myapp://home');

    await vi.advanceTimersByTimeAsync(2000);

    await expect(result).resolves.toBe(false);
    expect(browser.location.href).toBe('myapp://home');
  });

  it('resolves false outside the browser', async () => {
    await expect(openDeeplink('myapp://home')).resolves.toBe(false);
  });
});
