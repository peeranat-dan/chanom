import type {
  LogLevel,
  LogProvider,
  LogRecord,
  Logger,
  LoggerOptions,
  ProviderErrorContext,
} from './types.ts';

import { consoleProvider } from './providers/console.ts';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const defaultOnError = (error: unknown, context: ProviderErrorContext): void => {
  // Log instead of rethrowing so a failing provider never crashes the host app.
  // oxlint-disable-next-line no-console
  console.error(`[logger] provider "${context.provider}" failed:`, error);
};

/**
 * Create a logger that fans every record out to all given providers (default:
 * the console), gated by the `enabled` switch and by level filtering
 * (changeable at runtime via {@link Logger.setLevel}).
 *
 * @example
 * // Console logging in development only.
 * const logger = createLogger({ enabled: import.meta.env.DEV, prefix: "cart" });
 * logger.debug("added item", item);
 *
 * @example
 * // Errors only, fanned out to the console and a custom provider.
 * const logger = createLogger({ level: "error", providers: [consoleProvider(), myProvider] });
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const providers: readonly LogProvider[] =
    options.providers === undefined ? [consoleProvider()] : [...options.providers];
  const { enabled = true, prefix } = options;
  const isEnabledNow = typeof enabled === 'function' ? enabled : () => enabled;
  const onError = options.onError ?? defaultOnError;
  let level: LogLevel = options.level ?? 'debug';

  const isEnabled = (at?: LogLevel): boolean => {
    if (!isEnabledNow()) return false;
    if (at === undefined) return true;
    return LEVEL_WEIGHT[at] >= LEVEL_WEIGHT[level];
  };

  const log = (at: LogLevel, args: readonly unknown[]): void => {
    if (!isEnabled(at)) return;
    const record: LogRecord = { level: at, prefix, args };
    for (const provider of providers) {
      try {
        provider.log(record);
      } catch (error) {
        onError(error, { provider: provider.name });
      }
    }
  };

  return {
    debug: (...args) => log('debug', args),
    info: (...args) => log('info', args),
    warn: (...args) => log('warn', args),
    error: (...args) => log('error', args),
    get level() {
      return level;
    },
    setLevel: (next) => {
      level = next;
    },
    isEnabled,
    child: (childPrefix, childOptions = {}) =>
      createLogger({
        providers,
        enabled,
        onError: options.onError,
        level: childOptions.level ?? level,
        prefix: prefix === undefined ? childPrefix : `${prefix}:${childPrefix}`,
      }),
  };
}
