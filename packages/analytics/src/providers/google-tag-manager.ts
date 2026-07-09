import type { AnalyticsProperties, AnalyticsProvider, PageView } from '../types.ts';

import { stripUndefined } from '../utils/strip-undefined.ts';

export interface GoogleTagManagerOptions {
  /** GTM container ID, e.g. `GTM-XXXXXXX`. */
  readonly containerId: string;
  /**
   * Inject the `gtm.js` script tag during `initialize`. Set to `false` when
   * GTM is already embedded in the page HTML. Defaults to `true`.
   */
  readonly loadScript?: boolean;
  /** Name of the global data layer array. Defaults to `dataLayer`. */
  readonly dataLayerName?: string;
}

type DataLayerWindow = Window & Record<string, unknown[] | undefined>;

/**
 * Google Tag Manager provider. Pushes structured messages onto the data
 * layer; which tags actually fire is configured inside the GTM container.
 *
 * Message shapes: events push `{ event: <name>, ...properties }`, page views
 * push `{ event: 'page_view', ... }`, identify pushes
 * `{ event: 'identify', user_id, user_traits }`, and reset pushes
 * `{ event: 'reset', user_id: undefined }`.
 */
export function googleTagManager(options: GoogleTagManagerOptions): AnalyticsProvider {
  const { containerId, loadScript = true, dataLayerName = 'dataLayer' } = options;

  const resolveDataLayer = (): unknown[] | undefined => {
    if (typeof window === 'undefined') return undefined;
    const w = window as unknown as DataLayerWindow;
    w[dataLayerName] ??= [];
    return w[dataLayerName];
  };

  return {
    name: 'google-tag-manager',
    initialize: () => {
      const dataLayer = resolveDataLayer();
      if (!dataLayer) return;
      dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      if (loadScript && typeof document !== 'undefined') {
        const params = new URLSearchParams({ id: containerId });
        if (dataLayerName !== 'dataLayer') params.set('l', dataLayerName);
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?${params.toString()}`;
        document.head.appendChild(script);
      }
    },
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      resolveDataLayer()?.push({ event: eventName, ...properties });
    },
    trackPageView: (pageView?: PageView) => {
      resolveDataLayer()?.push(
        stripUndefined({
          event: 'page_view',
          page_location: pageView?.path,
          page_title: pageView?.title,
          page_referrer: pageView?.referrer,
          ...pageView?.properties,
        }),
      );
    },
    identify: (userId: string, traits?: AnalyticsProperties) => {
      resolveDataLayer()?.push({ event: 'identify', user_id: userId, user_traits: traits });
    },
    reset: () => {
      resolveDataLayer()?.push({ event: 'reset', user_id: undefined });
    },
  };
}
