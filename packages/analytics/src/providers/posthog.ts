import type { AnalyticsProperties, AnalyticsProvider, PageView } from '../types.ts';

/**
 * The subset of the `posthog-js` client this provider needs. Structurally
 * matches the real client, so the package itself needs no PostHog dependency —
 * the app installs `posthog-js`, initializes it, and hands the client over.
 */
export interface PostHogClient {
  capture: (eventName: string, properties?: AnalyticsProperties) => unknown;
  identify: (distinctId: string, userProperties?: AnalyticsProperties) => unknown;
  reset: () => unknown;
}

export interface PostHogOptions {
  /** An initialized `posthog-js` client (e.g. the result of `posthog.init(...)`). */
  client: PostHogClient;
}

/**
 * PostHog provider. Wraps an app-supplied `posthog-js` client, so PostHog
 * stays out of this package's dependency tree and the app keeps full control
 * over `posthog.init` options (autocapture, persistence, proxying, ...).
 *
 * Page views are sent as PostHog's canonical `$pageview` event.
 */
export function postHog(options: PostHogOptions): AnalyticsProvider {
  const { client } = options;

  return {
    name: 'posthog',
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      client.capture(eventName, properties);
    },
    trackPageView: (pageView?: PageView) => {
      client.capture('$pageview', {
        $current_url: pageView?.path,
        title: pageView?.title,
        $referrer: pageView?.referrer,
        ...pageView?.properties,
      });
    },
    identify: (userId: string, traits?: AnalyticsProperties) => {
      client.identify(userId, traits);
    },
    reset: () => {
      client.reset();
    },
  };
}
