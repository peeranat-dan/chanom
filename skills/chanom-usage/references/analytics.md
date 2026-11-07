# @chanom/analytics

Vendor-neutral analytics facade. One instance fans every call out to Google
Analytics, Google Tag Manager, PostHog, or a custom provider. Zero runtime
dependencies; built-in providers no-op outside the browser (SSR-safe).

## Wire

Create `src/lib/analytics.ts` and import `analytics` from it everywhere:

```ts
import { createAnalytics, googleAnalytics, googleTagManager, postHog } from '@chanom/analytics';
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, { capture_pageview: false });

export const analytics = createAnalytics({
  providers: [
    googleAnalytics({ measurementId: import.meta.env.VITE_GA_ID }),
    googleTagManager({ containerId: import.meta.env.VITE_GTM_ID }),
    postHog({ client: posthog }),
  ],
  enabled: () => hasAnalyticsConsent(), // re-checked on every call
});
```

Call `await analytics.initialize()` once at app startup (e.g. in `main.tsx`).

Then at call sites:

```ts
analytics.trackPageView({ path: '/pricing', title: 'Pricing' });
analytics.trackEvent('signup', { plan: 'pro' });
analytics.identify(user.id, { plan: user.plan });
analytics.reset(); // on logout
```

## Rules

- Include only the providers the user named. PostHog needs `posthog-js`
  installed and initialized by the app; pass `capture_pageview: false` so page
  views flow through `trackPageView`.
- GA and GTM together double-count when the GTM container already has a GA4
  tag. Ask which route the user wants per destination.
- IDs and keys come from env vars (`VITE_*` under Vite), never hardcoded.
- Track page views from the router (one effect on location change), not per page.
- A custom destination is a plain object: `{ name, trackEvent(name, props) }`,
  typed `AnalyticsProvider`.
