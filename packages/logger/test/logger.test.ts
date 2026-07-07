import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LOG_LEVELS, type LogLevel, createLogger, logger } from '../src/index.js';

let spies: Record<LogLevel, ReturnType<typeof vi.spyOn>>;

beforeEach(() => {
  spies = {
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('level filtering', () => {
  it('emits every level by default', () => {
    const log = createLogger({ environment: 'development' });
    for (const level of LOG_LEVELS) {
      log[level]('message');
      expect(spies[level]).toHaveBeenCalledWith('message');
    }
  });

  it('suppresses records below the configured level', () => {
    const log = createLogger({ environment: 'development', level: 'warn' });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');
    expect(spies.debug).not.toHaveBeenCalled();
    expect(spies.info).not.toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalledWith('c');
    expect(spies.error).toHaveBeenCalledWith('d');
  });

  it('suppresses everything when silent', () => {
    const log = createLogger({ environment: 'development', level: 'silent' });
    for (const level of LOG_LEVELS) log[level]('message');
    for (const level of LOG_LEVELS) expect(spies[level]).not.toHaveBeenCalled();
  });

  it('changes the level at runtime via setLevel', () => {
    const log = createLogger({ environment: 'development', level: 'error' });
    log.info('suppressed');
    expect(spies.info).not.toHaveBeenCalled();

    log.setLevel('debug');
    expect(log.level).toBe('debug');
    log.info('emitted');
    expect(spies.info).toHaveBeenCalledWith('emitted');
  });
});

describe('environment gating', () => {
  it('is silent in environments outside the allowlist', () => {
    const log = createLogger({ environment: 'production' });
    for (const level of LOG_LEVELS) log[level]('message');
    for (const level of LOG_LEVELS) expect(spies[level]).not.toHaveBeenCalled();
  });

  it('enables development and test by default', () => {
    createLogger({ environment: 'development' }).info('dev');
    createLogger({ environment: 'test' }).info('test');
    expect(spies.info).toHaveBeenCalledTimes(2);
  });

  it('respects a custom environment allowlist', () => {
    const options = { environments: ['staging'] };
    createLogger({ ...options, environment: 'staging' }).info('staging');
    createLogger({ ...options, environment: 'development' }).info('dev');
    expect(spies.info).toHaveBeenCalledTimes(1);
    expect(spies.info).toHaveBeenCalledWith('staging');
  });

  it('emits everywhere with the "*" wildcard', () => {
    const log = createLogger({ environments: '*', environment: 'production', level: 'error' });
    log.error('boom');
    expect(spies.error).toHaveBeenCalledWith('boom');
  });

  it('detects the environment when none is given (vitest runs in "test")', () => {
    const log = createLogger();
    expect(log.environment).toBe('test');
    log.info('detected');
    expect(spies.info).toHaveBeenCalledWith('detected');
  });
});

describe('isEnabled', () => {
  it('reports per-level and overall enablement', () => {
    const log = createLogger({ environment: 'development', level: 'warn' });
    expect(log.isEnabled()).toBe(true);
    expect(log.isEnabled('debug')).toBe(false);
    expect(log.isEnabled('warn')).toBe(true);
    expect(log.isEnabled('error')).toBe(true);
  });

  it('reports false for everything when the environment is gated off', () => {
    const log = createLogger({ environment: 'production' });
    expect(log.isEnabled()).toBe(false);
    expect(log.isEnabled('error')).toBe(false);
  });

  it('reports false overall when silent', () => {
    const log = createLogger({ environment: 'development', level: 'silent' });
    expect(log.isEnabled()).toBe(false);
  });
});

describe('prefixes and child loggers', () => {
  it('prints the prefix before the record', () => {
    const log = createLogger({ environment: 'development', prefix: 'cart' });
    log.info('added', 42);
    expect(spies.info).toHaveBeenCalledWith('[cart]', 'added', 42);
  });

  it('joins child prefixes with ":"', () => {
    const log = createLogger({ environment: 'development', prefix: 'cart' });
    log.child('checkout').info('paid');
    expect(spies.info).toHaveBeenCalledWith('[cart:checkout]', 'paid');
  });

  it('inherits environment gating and current level, but overrides independently', () => {
    const parent = createLogger({ environment: 'production', prefix: 'cart' });
    parent.child('checkout').error('never emitted');
    expect(spies.error).not.toHaveBeenCalled();

    const dev = createLogger({ environment: 'development', level: 'error' });
    const child = dev.child('sub', { level: 'debug' });
    child.debug('emitted');
    expect(spies.debug).toHaveBeenCalledWith('[sub]', 'emitted');
    dev.debug('still suppressed');
    expect(spies.debug).toHaveBeenCalledTimes(1);
  });
});

describe('default logger', () => {
  it('is a ready-to-use instance', () => {
    expect(logger.environment).toBe('test');
    logger.warn('careful');
    expect(spies.warn).toHaveBeenCalledWith('careful');
  });
});
