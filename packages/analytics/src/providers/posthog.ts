import type { AnalyticsProperties, AnalyticsProvider, PageView } from '../types.ts';

import { stripUndefined } from '../utils/strip-undefined.ts';

/**
 * Minimal subset of the `posthog-js` client used by this provider. Any
 * initialized `posthog-js` instance satisfies it.
 */
export interface PostHogClient {
  readonly capture: (eventName: string, properties?: AnalyticsProperties) => unknown;
  readonly identify: (distinctId: string, userProperties?: AnalyticsProperties) => unknown;
  readonly reset: () => unknown;
}

export interface PostHogOptions {
  /** An initialized `posthog-js` client (e.g. the result of `posthog.init(...)`). */
  readonly client: PostHogClient;
}

/**
 * PostHog provider. Pass your own initialized `posthog-js` client; page views
 * are captured as PostHog's canonical `$pageview` event.
 */
export function postHog(options: PostHogOptions): AnalyticsProvider {
  const { client } = options;

  return {
    name: 'posthog',
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      client.capture(eventName, properties);
    },
    trackPageView: (pageView?: PageView) => {
      client.capture(
        '$pageview',
        stripUndefined({
          $current_url: pageView?.path,
          title: pageView?.title,
          $referrer: pageView?.referrer,
          ...pageView?.properties,
        }),
      );
    },
    identify: (userId: string, traits?: AnalyticsProperties) => {
      client.identify(userId, traits);
    },
    reset: () => {
      client.reset();
    },
  };
}
