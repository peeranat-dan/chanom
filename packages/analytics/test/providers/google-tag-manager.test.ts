import { describe, expect, it } from 'vitest';

import { googleTagManager } from '../../src/providers/google-tag-manager.ts';
import { stubBrowser } from '../support/browser.ts';

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

    expect(fakeWindow['dataLayer']).toStrictEqual([
      { event: 'signup', plan: 'pro' },
      { event: 'page_view', page_location: '/pricing', page_title: 'Pricing' },
      { event: 'identify', user_id: 'user-1', user_traits: { plan: 'pro' } },
      { event: 'reset', user_id: undefined },
    ]);
  });

  it('omits undefined page view fields from the pushed message', () => {
    const { fakeWindow } = stubBrowser();
    googleTagManager({ containerId: 'GTM-TEST', loadScript: false }).trackPageView?.();

    expect(fakeWindow['dataLayer']).toStrictEqual([{ event: 'page_view' }]);
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
