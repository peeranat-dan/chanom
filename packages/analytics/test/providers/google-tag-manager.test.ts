import { afterEach, describe, expect, it, vi } from 'vitest';

import { googleTagManager } from '../../src/providers/google-tag-manager.ts';

const stubBrowser = () => {
  const appended: Array<{ src: string; async: boolean }> = [];
  const fakeWindow: Record<string, unknown> = {};
  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('document', {
    createElement: () => ({ src: '', async: false }),
    head: {
      appendChild: (script: { src: string; async: boolean }) => {
        appended.push(script);
      },
    },
  });
  return { fakeWindow, appended };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('googleTagManager', () => {
  it('pushes gtm.start and injects the script on initialize', () => {
    const { fakeWindow, appended } = stubBrowser();
    googleTagManager({ containerId: 'GTM-TEST' }).initialize?.();

    const dataLayer = fakeWindow['dataLayer'] as unknown[];
    expect(dataLayer[0]).toMatchObject({ event: 'gtm.js', 'gtm.start': expect.any(Number) });
    expect(appended[0]).toMatchObject({
      async: true,
      src: 'https://www.googletagmanager.com/gtm.js?id=GTM-TEST',
    });
  });

  it('pushes events, page views, identify, and reset onto the data layer', () => {
    const { fakeWindow } = stubBrowser();
    const provider = googleTagManager({ containerId: 'GTM-TEST', loadScript: false });

    provider.trackEvent('signup', { plan: 'pro' });
    provider.trackPageView?.({ path: '/pricing', title: 'Pricing' });
    provider.identify?.('user-1', { plan: 'pro' });
    provider.reset?.();

    expect(fakeWindow['dataLayer']).toEqual([
      { event: 'signup', plan: 'pro' },
      {
        event: 'page_view',
        page_location: '/pricing',
        page_title: 'Pricing',
        page_referrer: undefined,
      },
      { event: 'identify', user_id: 'user-1', user_traits: { plan: 'pro' } },
      { event: 'reset', user_id: undefined },
    ]);
  });

  it('supports a custom data layer name', () => {
    const { fakeWindow, appended } = stubBrowser();
    const provider = googleTagManager({ containerId: 'GTM-TEST', dataLayerName: 'customLayer' });

    provider.initialize?.();
    provider.trackEvent('click');

    expect(appended[0]?.src).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-TEST&l=customLayer',
    );
    expect(fakeWindow['customLayer']).toHaveLength(2);
    expect(fakeWindow['dataLayer']).toBeUndefined();
  });

  it('is a safe no-op outside the browser', () => {
    const provider = googleTagManager({ containerId: 'GTM-TEST' });
    expect(() => {
      provider.initialize?.();
      provider.trackEvent('click');
    }).not.toThrow();
  });
});
