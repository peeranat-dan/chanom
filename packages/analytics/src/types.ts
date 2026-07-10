/** Arbitrary key/value payload attached to events, page views, and identities. */
export type AnalyticsProperties = Record<string, unknown>;

/** Describes the page being viewed. Every field is optional; providers fall back to `window.location` / `document.title` where they can. */
export interface PageView {
  /** Path (or full URL) of the page, e.g. `/pricing`. */
  readonly path?: string;
  /** Human-readable page title. */
  readonly title?: string;
  /** Referrer URL. */
  readonly referrer?: string;
  /** Extra properties forwarded to every provider. */
  readonly properties?: AnalyticsProperties;
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
  readonly initialize?: () => void | Promise<void>;
  /** Record a named event with optional properties. */
  readonly trackEvent: (eventName: string, properties?: AnalyticsProperties) => void;
  /** Record a page view. */
  readonly trackPageView?: (pageView?: PageView) => void;
  /** Associate subsequent events with a user. */
  readonly identify?: (userId: string, traits?: AnalyticsProperties) => void;
  /** Clear the current user association (e.g. on logout). */
  readonly reset?: () => void;
}

/** Context passed to `onError` so failures can be attributed to a provider. */
export interface ProviderErrorContext {
  readonly provider: string;
  readonly method: 'initialize' | 'trackEvent' | 'trackPageView' | 'identify' | 'reset';
}

export interface AnalyticsOptions {
  /** Destinations every call fans out to, in order. */
  readonly providers: readonly AnalyticsProvider[];
  /**
   * Master switch, e.g. wire it to cookie consent. When `false`, every method
   * becomes a no-op. Pass a function to re-evaluate on every call, so consent
   * granted or revoked after creation takes effect immediately. Defaults to
   * `true`.
   */
  readonly enabled?: boolean | (() => boolean);
  /**
   * Called when a provider throws. One misbehaving provider never breaks the
   * others or the host app. Defaults to `console.error`.
   */
  readonly onError?: (error: unknown, context: ProviderErrorContext) => void;
}

/** A single client-side analytics instance that fans every call out to all providers. */
export interface Analytics {
  readonly providers: readonly AnalyticsProvider[];
  /** Initialize all providers. Safe to call more than once; runs only the first time. */
  readonly initialize: () => Promise<void>;
  readonly trackEvent: (eventName: string, properties?: AnalyticsProperties) => void;
  readonly trackPageView: (pageView?: PageView) => void;
  readonly identify: (userId: string, traits?: AnalyticsProperties) => void;
  readonly reset: () => void;
}
