/** Log levels, ordered from least to most severe. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/** A level a record can be logged at. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/** A level a logger can be set to: any {@link LogLevel}, or `"silent"` to suppress everything. */
export type LoggerLevel = LogLevel | 'silent';

const LEVEL_WEIGHT: Record<LoggerLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export interface LoggerOptions {
  /**
   * Minimum level to emit; records below it are suppressed. `"silent"`
   * suppresses everything. Defaults to `"debug"` (emit all levels).
   */
  level?: LoggerLevel;
  /**
   * Environments in which the logger emits at all. Pass `"*"` to emit in
   * every environment. Defaults to `["development", "test"]`, so production
   * builds stay quiet with no extra configuration.
   */
  environments?: readonly string[] | '*';
  /**
   * The current environment. Defaults to auto-detection: Vite's
   * `import.meta.env.MODE`, then `process.env.NODE_ENV`, then `"production"`
   * (fail silent rather than fail noisy).
   */
  environment?: string;
  /** Label printed as `[prefix]` before every record, e.g. a feature or component name. */
  prefix?: string;
}

export interface Logger {
  /** Log a record at `debug` level. */
  debug(...args: unknown[]): void;
  /** Log a record at `info` level. */
  info(...args: unknown[]): void;
  /** Log a record at `warn` level. */
  warn(...args: unknown[]): void;
  /** Log a record at `error` level. */
  error(...args: unknown[]): void;
  /** The environment this logger resolved when it was created. */
  readonly environment: string;
  /** The current minimum level. */
  readonly level: LoggerLevel;
  /** Change the minimum level at runtime, e.g. from a debug toggle. */
  setLevel(level: LoggerLevel): void;
  /**
   * Whether a record at `level` would be emitted. With no argument, whether
   * the logger emits anything at all. Use it to skip work that only exists
   * to build a log message.
   */
  isEnabled(level?: LogLevel): boolean;
  /**
   * Create a logger for a sub-area (a component, a hook, a feature) that
   * inherits this logger's environment gating. Prefixes are joined with `:`,
   * so `logger.child("cart").child("checkout")` prints `[cart:checkout]`.
   * The child starts at this logger's current level unless overridden, and
   * changes its level independently afterwards.
   */
  child(prefix: string, options?: Pick<LoggerOptions, 'level'>): Logger;
}

/**
 * Detect the current environment without assuming a runtime: Vite-style
 * `import.meta.env.MODE` first, then Node-style `process.env.NODE_ENV`
 * (read off `globalThis` so browsers without a `process` global don't
 * throw), and `"production"` when neither exists — an unknown environment
 * should stay quiet, not leak logs.
 */
function detectEnvironment(): string {
  const meta = import.meta as ImportMeta & { env?: { MODE?: unknown } };
  if (typeof meta.env?.MODE === 'string' && meta.env.MODE !== '') {
    return meta.env.MODE;
  }
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const nodeEnv = proc?.env?.NODE_ENV;
  if (typeof nodeEnv === 'string' && nodeEnv !== '') {
    return nodeEnv;
  }
  return 'production';
}

/**
 * Create a console logger gated by environment and level.
 *
 * Environment gating decides whether the logger emits at all and is fixed at
 * creation; level filtering decides which records get through and can change
 * at runtime via {@link Logger.setLevel}.
 *
 * @example
 * // Logs everywhere logging is enabled (development and test by default).
 * const logger = createLogger({ prefix: "cart" });
 * logger.debug("added item", item);
 *
 * @example
 * // Errors only, in every environment including production.
 * const logger = createLogger({ environments: "*", level: "error" });
 */
function createLogger(options: LoggerOptions = {}): Logger {
  const { environments = ['development', 'test'], prefix } = options;
  const environment = options.environment ?? detectEnvironment();
  const enabled = environments === '*' || environments.includes(environment);
  let level: LoggerLevel = options.level ?? 'debug';

  const isEnabled = (at?: LogLevel): boolean => {
    if (!enabled) return false;
    if (at === undefined) return level !== 'silent';
    return LEVEL_WEIGHT[at] >= LEVEL_WEIGHT[level];
  };

  const log = (at: LogLevel, args: unknown[]): void => {
    if (!isEnabled(at)) return;
    if (prefix === undefined) {
      // oxlint-disable-next-line no-console -- this package is the sanctioned console wrapper
      console[at](...args);
    } else {
      // oxlint-disable-next-line no-console -- this package is the sanctioned console wrapper
      console[at](`[${prefix}]`, ...args);
    }
  };

  return {
    debug: (...args) => log('debug', args),
    info: (...args) => log('info', args),
    warn: (...args) => log('warn', args),
    error: (...args) => log('error', args),
    environment,
    get level() {
      return level;
    },
    setLevel(next) {
      level = next;
    },
    isEnabled,
    child(childPrefix, childOptions = {}) {
      return createLogger({
        environments,
        environment,
        level: childOptions.level ?? level,
        prefix: prefix === undefined ? childPrefix : `${prefix}:${childPrefix}`,
      });
    },
  };
}

/** A ready-to-use logger with the default options. */
export const logger: Logger = createLogger();

export default createLogger;
export { createLogger };
