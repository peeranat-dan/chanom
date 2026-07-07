import type { AnalyticsProperties, AnalyticsProvider, PageView } from '../types.ts';

/** Minimal shape of the GA4 `gtag` command queue function. */
export type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export interface GoogleAnalyticsOptions {
  /** GA4 measurement ID, e.g. `G-XXXXXXXXXX`. */
  measurementId: string;
  /**
   * Inject the `gtag.js` script tag during `initialize`. Set to `false` when
   * the script is already on the page (or added by GTM). Defaults to `true`.
   */
  loadScript?: boolean;
  /**
   * Custom `gtag` function, mainly for tests or pre-existing setups.
   * Defaults to `window.gtag` (created during `initialize` if missing).
   */
  gtag?: Gtag;
}

const resolveGtag = (options: GoogleAnalyticsOptions): Gtag | undefined =>
  options.gtag ?? (typeof window === 'undefined' ? undefined : window.gtag);

/**
 * Google Analytics 4 provider. Sends events through the `gtag` command queue.
 *
 * Automatic page views are disabled (`send_page_view: false`) so page views
 * flow through `Analytics.trackPageView` like every other provider.
 */
export function googleAnalytics(options: GoogleAnalyticsOptions): AnalyticsProvider {
  const { measurementId, loadScript = true } = options;

  return {
    name: 'google-analytics',
    initialize: () => {
      if (options.gtag === undefined) {
        if (typeof window === 'undefined') return;
        window.dataLayer ??= [];
        // gtag must forward `arguments` (not a rest array) — GA's snippet relies on it.
        window.gtag ??= function gtag() {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer?.push(arguments);
        };
        if (loadScript && typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
          document.head.appendChild(script);
        }
      }
      const gtag = resolveGtag(options);
      gtag?.('js', new Date());
      gtag?.('config', measurementId, { send_page_view: false });
    },
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      resolveGtag(options)?.('event', eventName, properties ?? {});
    },
    trackPageView: (pageView?: PageView) => {
      resolveGtag(options)?.('event', 'page_view', {
        page_location: pageView?.path,
        page_title: pageView?.title,
        page_referrer: pageView?.referrer,
        ...pageView?.properties,
      });
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
