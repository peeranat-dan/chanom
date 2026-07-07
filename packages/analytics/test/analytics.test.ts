import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsProvider } from '../src/types.ts';

import { createAnalytics } from '../src/analytics.ts';

const makeProvider = (name: string): AnalyticsProvider => ({
  name,
  initialize: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
});

describe('createAnalytics', () => {
  it('fans every call out to all providers', async () => {
    const a = makeProvider('a');
    const b = makeProvider('b');
    const analytics = createAnalytics({ providers: [a, b] });

    await analytics.initialize();
    analytics.trackEvent('signup', { plan: 'pro' });
    analytics.trackPageView({ path: '/pricing', title: 'Pricing' });
    analytics.identify('user-1', { plan: 'pro' });
    analytics.reset();

    for (const provider of [a, b]) {
      expect(provider.initialize).toHaveBeenCalledOnce();
      expect(provider.trackEvent).toHaveBeenCalledExactlyOnceWith('signup', { plan: 'pro' });
      expect(provider.trackPageView).toHaveBeenCalledExactlyOnceWith({
        path: '/pricing',
        title: 'Pricing',
      });
      expect(provider.identify).toHaveBeenCalledExactlyOnceWith('user-1', { plan: 'pro' });
      expect(provider.reset).toHaveBeenCalledOnce();
    }
  });

  it('isolates a throwing provider and reports it via onError', () => {
    const failing: AnalyticsProvider = {
      name: 'failing',
      trackEvent: () => {
        throw new Error('boom');
      },
    };
    const healthy = makeProvider('healthy');
    const onError = vi.fn();
    const analytics = createAnalytics({ providers: [failing, healthy], onError });

    analytics.trackEvent('click');

    expect(healthy.trackEvent).toHaveBeenCalledExactlyOnceWith('click', undefined);
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), {
      provider: 'failing',
      method: 'trackEvent',
    });
  });

  it('reports async initialize failures without rejecting', async () => {
    const failing: AnalyticsProvider = {
      name: 'failing',
      initialize: () => Promise.reject(new Error('init boom')),
      trackEvent: vi.fn(),
    };
    const healthy = makeProvider('healthy');
    const onError = vi.fn();
    const analytics = createAnalytics({ providers: [failing, healthy], onError });

    await expect(analytics.initialize()).resolves.toBeUndefined();
    expect(healthy.initialize).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), {
      provider: 'failing',
      method: 'initialize',
    });
  });

  it('initializes providers only once across repeated calls', async () => {
    const provider = makeProvider('a');
    const analytics = createAnalytics({ providers: [provider] });

    await Promise.all([analytics.initialize(), analytics.initialize()]);
    await analytics.initialize();

    expect(provider.initialize).toHaveBeenCalledOnce();
  });

  it('skips optional methods a provider does not implement', () => {
    const minimal: AnalyticsProvider = { name: 'minimal', trackEvent: vi.fn() };
    const onError = vi.fn();
    const analytics = createAnalytics({ providers: [minimal], onError });

    analytics.trackPageView();
    analytics.identify('user-1');
    analytics.reset();

    expect(onError).not.toHaveBeenCalled();
  });

  it('becomes a no-op when disabled', async () => {
    const provider = makeProvider('a');
    const analytics = createAnalytics({ providers: [provider], enabled: false });

    await analytics.initialize();
    analytics.trackEvent('click');
    analytics.trackPageView();
    analytics.identify('user-1');
    analytics.reset();

    expect(provider.initialize).not.toHaveBeenCalled();
    expect(provider.trackEvent).not.toHaveBeenCalled();
    expect(provider.trackPageView).not.toHaveBeenCalled();
    expect(provider.identify).not.toHaveBeenCalled();
    expect(provider.reset).not.toHaveBeenCalled();
  });
});
