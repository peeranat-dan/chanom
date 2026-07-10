import { describe, expect, it, vi } from 'vitest';

import { googleAnalytics } from '../../src/providers/google-analytics.ts';
import { stubBrowser } from '../support/browser.ts';

describe('googleAnalytics', () => {
  it('maps calls to gtag commands', () => {
    const gtag = vi.fn();
    const provider = googleAnalytics({ measurementId: 'G-TEST', gtag });

    provider.initialize?.();
    provider.trackEvent('signup', { plan: 'pro' });
    provider.trackPageView?.({ path: '/pricing', title: 'Pricing', referrer: '/home' });
    provider.identify?.('user-1', { plan: 'pro' });
    provider.reset?.();

    expect(gtag.mock.calls).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-TEST', { send_page_view: false }],
      ['event', 'signup', { plan: 'pro' }],
      [
        'event',
        'page_view',
        { page_location: '/pricing', page_title: 'Pricing', page_referrer: '/home' },
      ],
      ['set', { user_id: 'user-1' }],
      ['set', 'user_properties', { plan: 'pro' }],
      ['set', { user_id: null }],
    ]);
  });

  it('omits undefined page view fields so GA falls back to its own values', () => {
    const gtag = vi.fn();
    const provider = googleAnalytics({ measurementId: 'G-TEST', gtag });

    provider.trackPageView?.();
    provider.trackPageView?.({ title: 'Pricing' });

    expect(gtag.mock.calls).toStrictEqual([
      ['event', 'page_view', {}],
      ['event', 'page_view', { page_title: 'Pricing' }],
    ]);
  });

  it('bootstraps dataLayer, gtag, and the script tag on initialize', () => {
    const { fakeWindow, appended } = stubBrowser();
    const provider = googleAnalytics({ measurementId: 'G-TEST' });

    provider.initialize?.();

    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({
      async: true,
      src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST',
    });
    // The bootstrap gtag pushes its arguments onto the data layer.
    const dataLayer = fakeWindow['dataLayer'] as ArrayLike<unknown>[];
    expect(Array.from(dataLayer[0]!)).toEqual(['js', expect.any(Date)]);
    expect(Array.from(dataLayer[1]!)).toEqual(['config', 'G-TEST', { send_page_view: false }]);

    provider.trackEvent('click');
    expect(Array.from(dataLayer[2]!)).toEqual(['event', 'click', {}]);
  });

  it('queues events tracked before initialize instead of dropping them', () => {
    const { fakeWindow } = stubBrowser();
    const provider = googleAnalytics({ measurementId: 'G-TEST' });

    provider.trackEvent('early-click', { plan: 'pro' });

    const dataLayer = fakeWindow['dataLayer'] as ArrayLike<unknown>[];
    expect(Array.from(dataLayer[0]!)).toEqual(['event', 'early-click', { plan: 'pro' }]);
  });

  it('injects the script even when a custom gtag is supplied', () => {
    const { appended } = stubBrowser();
    googleAnalytics({ measurementId: 'G-TEST', gtag: vi.fn() }).initialize?.();
    expect(appended).toHaveLength(1);
  });

  it('skips script injection when loadScript is false', () => {
    const { appended } = stubBrowser();
    googleAnalytics({ measurementId: 'G-TEST', loadScript: false }).initialize?.();
    expect(appended).toHaveLength(0);
  });

  it('is a safe no-op outside the browser', () => {
    const provider = googleAnalytics({ measurementId: 'G-TEST' });
    expect(() => {
      provider.initialize?.();
      provider.trackEvent('click');
      provider.trackPageView?.();
      provider.identify?.('user-1');
      provider.reset?.();
    }).not.toThrow();
  });
});
