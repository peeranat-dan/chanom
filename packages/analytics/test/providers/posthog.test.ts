import { describe, expect, it, vi } from 'vitest';

import { postHog } from '../../src/providers/posthog.ts';

const makeClient = () => ({
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
});

describe('postHog', () => {
  it('forwards events to the wrapped client', () => {
    const client = makeClient();
    const provider = postHog({ client });

    provider.trackEvent('signup', { plan: 'pro' });
    provider.identify?.('user-1', { plan: 'pro' });
    provider.reset?.();

    expect(client.capture).toHaveBeenCalledExactlyOnceWith('signup', { plan: 'pro' });
    expect(client.identify).toHaveBeenCalledExactlyOnceWith('user-1', { plan: 'pro' });
    expect(client.reset).toHaveBeenCalledOnce();
  });

  it('sends page views as the canonical $pageview event', () => {
    const client = makeClient();
    postHog({ client }).trackPageView?.({
      path: 'https://example.com/pricing',
      title: 'Pricing',
      referrer: 'https://example.com/',
      properties: { experiment: 'b' },
    });

    expect(client.capture).toHaveBeenCalledExactlyOnceWith('$pageview', {
      $current_url: 'https://example.com/pricing',
      title: 'Pricing',
      $referrer: 'https://example.com/',
      experiment: 'b',
    });
  });
});
