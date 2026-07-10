/** Log levels, ordered from least to most severe. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/** A level a record can be logged at. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/** A single log call, as handed to every provider. */
export interface LogRecord {
  /** Level the record was logged at. */
  readonly level: LogLevel;
  /** Joined prefix chain (e.g. `"cart:checkout"`), or `undefined` on the root logger. */
  readonly prefix?: string;
  /** The arguments passed to the log call. */
  readonly args: readonly unknown[];
}

/** The contract every log destination implements. */
export interface LogProvider {
  /** Stable identifier used in error reporting, e.g. `console`. */
  readonly name: string;
  /** Write one record. Called only for records that pass the enabled and level checks. */
  readonly log: (record: LogRecord) => void;
}

/** Context passed to `onError` so failures can be attributed to a provider. */
export interface ProviderErrorContext {
  readonly provider: string;
}

export interface LoggerOptions {
  /** Destinations every record fans out to, in order. Defaults to `[consoleProvider()]`. */
  readonly providers?: readonly LogProvider[];
  /**
   * Master switch deciding whether the logger emits at all, e.g. wire it to
   * `import.meta.env.DEV` or a feature flag. Pass a function to re-evaluate
   * on every call. Defaults to `true`.
   */
  readonly enabled?: boolean | (() => boolean);
  /** Minimum level to emit. Defaults to `"debug"`. To suppress everything, set `enabled` to `false`. */
  readonly level?: LogLevel;
  /** Label printed as `[prefix]` before every record, e.g. a feature or component name. */
  readonly prefix?: string;
  /**
   * Called when a provider throws. One misbehaving provider never breaks the
   * others or the host app. Defaults to `console.error`.
   */
  readonly onError?: (error: unknown, context: ProviderErrorContext) => void;
}

/** A logger instance that fans every record out to all providers. */
export interface Logger {
  /** Log a record at `debug` level. */
  readonly debug: (...args: unknown[]) => void;
  /** Log a record at `info` level. */
  readonly info: (...args: unknown[]) => void;
  /** Log a record at `warn` level. */
  readonly warn: (...args: unknown[]) => void;
  /** Log a record at `error` level. */
  readonly error: (...args: unknown[]) => void;
  /** The current minimum level. */
  readonly level: LogLevel;
  /** Change the minimum level at runtime, e.g. from a debug toggle. */
  readonly setLevel: (level: LogLevel) => void;
  /**
   * Whether a record at `level` would be emitted; with no argument, whether
   * the logger emits anything at all.
   */
  readonly isEnabled: (level?: LogLevel) => boolean;
  /**
   * Create a child logger with a nested prefix (`logger.child("cart")` prints
   * `[cart]`, chaining prints `[cart:checkout]`). Inherits this logger's
   * providers, enabled switch, and current level; its own level is independent.
   */
  readonly child: (prefix: string, options?: Pick<LoggerOptions, 'level'>) => Logger;
}
