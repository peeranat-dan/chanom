import type {
  Analytics,
  AnalyticsOptions,
  AnalyticsProperties,
  AnalyticsProvider,
  PageView,
  ProviderErrorContext,
} from './types.ts';

const defaultOnError = (error: unknown, context: ProviderErrorContext): void => {
  // Default failure sink: analytics must never crash the host app, but silence would hide misconfiguration.
  // oxlint-disable-next-line no-console
  console.error(`[analytics] provider "${context.provider}" failed in ${context.method}:`, error);
};

/**
 * Create an analytics facade that fans every call out to all given providers.
 *
 * Providers are isolated from each other: a throwing provider is reported via
 * `onError` (default: `console.error`) and the remaining providers still run.
 */
export function createAnalytics(options: AnalyticsOptions): Analytics {
  const providers: readonly AnalyticsProvider[] = [...options.providers];
  const { enabled = true } = options;
  const isEnabled = typeof enabled === 'function' ? enabled : () => enabled;
  const onError = options.onError ?? defaultOnError;

  let initialized: Promise<void> | undefined;

  const forEachProvider = (
    method: ProviderErrorContext['method'],
    run: (provider: AnalyticsProvider) => void,
  ): void => {
    if (!isEnabled()) return;
    for (const provider of providers) {
      try {
        run(provider);
      } catch (error) {
        onError(error, { provider: provider.name, method });
      }
    }
  };

  const initializeAll = async (): Promise<void> => {
    // Initialize concurrently; each provider's failure is caught individually
    // so one bad provider cannot reject the whole initialization.
    await Promise.all(
      providers.map(async (provider) => {
        try {
          await provider.initialize?.();
        } catch (error) {
          onError(error, { provider: provider.name, method: 'initialize' });
        }
      }),
    );
  };

  return {
    providers,
    initialize: () => {
      // Not memoized while disabled, so initialization still runs once consent arrives.
      if (!isEnabled()) return Promise.resolve();
      initialized ??= initializeAll();
      return initialized;
    },
    trackEvent: (eventName: string, properties?: AnalyticsProperties) => {
      forEachProvider('trackEvent', (provider) => provider.trackEvent(eventName, properties));
    },
    trackPageView: (pageView?: PageView) => {
      forEachProvider('trackPageView', (provider) => provider.trackPageView?.(pageView));
    },
    identify: (userId: string, traits?: AnalyticsProperties) => {
      forEachProvider('identify', (provider) => provider.identify?.(userId, traits));
    },
    reset: () => {
      forEachProvider('reset', (provider) => provider.reset?.());
    },
  };
}
