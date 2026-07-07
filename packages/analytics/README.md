# @chanom/analytics

Provider-agnostic web analytics facade. Create one analytics instance, plug in Google Analytics, Google Tag Manager, PostHog — or your own provider — and every `trackEvent` / `trackPageView` / `identify` / `reset` call fans out to all of them.

## Why

- **One call site.** Product code tracks against a stable, vendor-neutral API instead of sprinkling `gtag(...)`, `dataLayer.push(...)`, and `posthog.capture(...)` everywhere.
- **Swap or stack vendors freely.** Adding, removing, or A/B-running destinations is a one-line change where the instance is created.
- **Fault isolation.** A throwing or blocked provider (ad-blockers love analytics scripts) is reported via `onError` and never breaks the other providers or your app.
- **Consent-friendly.** The `enabled` flag turns the whole instance into a no-op, so wiring it to a cookie-consent banner is trivial.
- **SSR-safe.** Built-in providers no-op outside the browser.

## Usage

```ts
import posthog from 'posthog-js';
import { createAnalytics, googleAnalytics, googleTagManager, postHog } from '@chanom/analytics';

posthog.init('phc_xxx', { capture_pageview: false });

export const analytics = createAnalytics({
  providers: [
    googleAnalytics({ measurementId: 'G-XXXXXXXXXX' }),
    googleTagManager({ containerId: 'GTM-XXXXXXX' }),
    postHog({ client: posthog }),
  ],
  enabled: hasAnalyticsConsent(),
});

await analytics.initialize();

analytics.trackPageView({ path: '/pricing', title: 'Pricing' });
analytics.trackEvent('signup', { plan: 'pro' });
analytics.identify('user-1', { plan: 'pro' });
analytics.reset(); // e.g. on logout
```

The PostHog provider wraps a `posthog-js` client you initialize yourself, so this package has zero runtime dependencies and you keep full control over `posthog.init` options.

## Custom providers

A provider is a plain object; only `name` and `trackEvent` are required:

```ts
import type { AnalyticsProvider } from '@chanom/analytics';

const consoleProvider: AnalyticsProvider = {
  name: 'console',
  trackEvent: (name, properties) => console.log('[analytics]', name, properties),
};
```

## Notes on the built-in providers

- **Google Analytics** (`googleAnalytics`): injects `gtag.js` on `initialize` (disable with `loadScript: false`) and configures GA4 with `send_page_view: false`, so page views flow through `trackPageView` like every other provider.
- **Google Tag Manager** (`googleTagManager`): pushes structured messages onto the data layer (`{ event, ... }`); which tags fire is configured inside your GTM container. Supports a custom `dataLayerName`.
- **Running GA and GTM together**: if your GTM container already has a GA4 tag, also adding `googleAnalytics` will double-count. Pick one route per destination.
