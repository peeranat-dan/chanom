/** Arbitrary key/value payload attached to events, page views, and identities. */
export type AnalyticsProperties = Record<string, unknown>;

/** Describes the page being viewed. Every field is optional; providers fall back to `window.location` / `document.title` where they can. */
export interface PageView {
  /** Path (or full URL) of the page, e.g. `/pricing`. */
  path?: string;
  /** Human-readable page title. */
  title?: string;
  /** Referrer URL. */
  referrer?: string;
  /** Extra properties forwarded to every provider. */
  properties?: AnalyticsProperties;
}

/**
 * The contract every analytics destination implements.
 *
 * Only `name` and `trackEvent` are required; the facade silently skips
 * optional methods a provider does not support.
 */
export interface AnalyticsProvider {
  /** Stable identifier used in error reporting, e.g. `google-analytics`. */
  readonly name: string;
  /** One-time setup (script injection, SDK init). Called once by `Analytics.initialize`. */
  initialize?: () => void | Promise<void>;
  /** Record a named event with optional properties. */
  trackEvent: (eventName: string, properties?: AnalyticsProperties) => void;
  /** Record a page view. */
  trackPageView?: (pageView?: PageView) => void;
  /** Associate subsequent events with a user. */
  identify?: (userId: string, traits?: AnalyticsProperties) => void;
  /** Clear the current user association (e.g. on logout). */
  reset?: () => void;
}

/** Context passed to `onError` so failures can be attributed to a provider. */
export interface ProviderErrorContext {
  provider: string;
  method: 'initialize' | 'trackEvent' | 'trackPageView' | 'identify' | 'reset';
}

export interface AnalyticsOptions {
  /** Destinations every call fans out to, in order. */
  providers: readonly AnalyticsProvider[];
  /**
   * Master switch, e.g. wire it to cookie consent. When `false`, every method
   * becomes a no-op. Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Called when a provider throws. One misbehaving provider never breaks the
   * others or the host app. Defaults to `console.error`.
   */
  onError?: (error: unknown, context: ProviderErrorContext) => void;
}

/** A single client-side analytics instance that fans every call out to all providers. */
export interface Analytics {
  readonly providers: readonly AnalyticsProvider[];
  /** Initialize all providers. Safe to call more than once; runs only the first time. */
  initialize: () => Promise<void>;
  trackEvent: (eventName: string, properties?: AnalyticsProperties) => void;
  trackPageView: (pageView?: PageView) => void;
  identify: (userId: string, traits?: AnalyticsProperties) => void;
  reset: () => void;
}
