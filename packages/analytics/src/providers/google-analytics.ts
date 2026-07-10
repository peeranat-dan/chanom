import type { AnalyticsProperties, AnalyticsProvider, PageView } from '../types.ts';

import { stripUndefined } from '../utils/strip-undefined.ts';

/** Minimal shape of the GA4 `gtag` command queue function. */
export type Gtag = (...args: unknown[]) => void;

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
};

export interface GoogleAnalyticsOptions {
  /** GA4 measurement ID, e.g. `G-XXXXXXXXXX`. */
  readonly measurementId: string;
  /**
   * Inject the `gtag.js` script tag during `initialize`. Set to `false` when
   * the script is already on the page (or added by GTM, or by a custom `gtag`
   * setup). Defaults to `true`.
   */
  readonly loadScript?: boolean;
  /**
   * Custom `gtag` function, e.g. for tests. Defaults to `window.gtag`,
   * created on first use if missing. Combine with `loadScript: false` when
   * your setup already loads `gtag.js`.
   */
  readonly gtag?: Gtag;
}

const resolveGtag = (options: GoogleAnalyticsOptions): Gtag | undefined => {
  if (options.gtag !== undefined) return options.gtag;
  if (typeof window === 'undefined') return undefined;
  const w = window as GtagWindow;
  // Bootstrap the queue so events tracked before `initialize` are not dropped.
  w.dataLayer ??= [];
  // GA's snippet requires `gtag` to forward `arguments`, not a rest array.
  w.gtag ??= function gtag() {
    w.dataLayer?.push(arguments);
  };
  return w.gtag;
};

/**
 * Google Analytics 4 provider, driven through the `gtag` command queue.
 * Automatic page views are disabled; send them via `Analytics.trackPageView`.
 */
export function googleAnalytics(options: GoogleAnalyticsOptions): AnalyticsProvider {
  const { measurementId, loadScript = true } = options;

  return {
    name: 'google-analytics',
    initialize: () => {
      const gtag = resolveGtag(options);
      if (gtag === undefined) return;
      if (loadScript && typeof document !== 'undefined') {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
      }
      gtag('js', new Date());
      gtag('config', measurementId, { send_page_view: false });
    },
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      resolveGtag(options)?.('event', eventName, properties ?? {});
    },
    trackPageView: (pageView?: PageView) => {
      resolveGtag(options)?.(
        'event',
        'page_view',
        stripUndefined({
          page_location: pageView?.path,
          page_title: pageView?.title,
          page_referrer: pageView?.referrer,
          ...pageView?.properties,
        }),
      );
    },
    identify: (userId: string, traits?: AnalyticsProperties) => {
      const gtag = resolveGtag(options);
      gtag?.('set', { user_id: userId });
      if (traits && Object.keys(traits).length > 0) {
        gtag?.('set', 'user_properties', traits);
      }
    },
    reset: () => {
      resolveGtag(options)?.('set', { user_id: null });
    },
  };
}
