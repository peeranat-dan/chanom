import { describe, expect, it, vi } from 'vitest';

import { LOG_LEVELS, createLogger } from '../src/index.ts';
import { recordingProvider, throwingProvider } from './support/providers.ts';

describe('level filtering', () => {
  it('emits every level by default', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider] });
    for (const level of LOG_LEVELS) log[level]('message');
    expect(records.map((record) => record.level)).toEqual([...LOG_LEVELS]);
  });

  it('suppresses records below the configured level', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider], level: 'warn' });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');
    expect(records).toEqual([
      { level: 'warn', prefix: undefined, args: ['c'] },
      { level: 'error', prefix: undefined, args: ['d'] },
    ]);
  });

  it('changes the level at runtime via setLevel', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider], level: 'error' });
    log.info('suppressed');
    expect(records).toEqual([]);

    log.setLevel('debug');
    expect(log.level).toBe('debug');
    log.info('emitted');
    expect(records).toEqual([{ level: 'info', prefix: undefined, args: ['emitted'] }]);
  });
});

describe('enabled switch', () => {
  it('emits nothing when disabled', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider], enabled: false });
    for (const level of LOG_LEVELS) log[level]('message');
    expect(records).toEqual([]);
  });

  it('re-evaluates a function switch on every call', () => {
    const { provider, records } = recordingProvider();
    let allowed = false;
    const log = createLogger({ providers: [provider], enabled: () => allowed });
    log.info('suppressed');
    expect(records).toEqual([]);

    allowed = true;
    log.info('emitted');
    expect(records).toEqual([{ level: 'info', prefix: undefined, args: ['emitted'] }]);
  });
});

describe('provider fan-out', () => {
  it('hands each record to every provider in order', () => {
    const a = recordingProvider('a');
    const b = recordingProvider('b');
    const log = createLogger({ providers: [a.provider, b.provider] });
    log.info('hello', 42);
    const expected = [{ level: 'info', prefix: undefined, args: ['hello', 42] }];
    expect(a.records).toEqual(expected);
    expect(b.records).toEqual(expected);
  });

  it('defaults to the console provider', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger().info('to console');
    expect(spy).toHaveBeenCalledWith('to console');
    spy.mockRestore();
  });

  it('reports a throwing provider via onError and keeps the others running', () => {
    const onError = vi.fn();
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [throwingProvider(), provider], onError });
    log.warn('careful');
    expect(records).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { provider: 'boom' });
  });

  it('reports provider failures to console.error by default', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger({ providers: [throwingProvider()] });
    log.info('message');
    expect(spy).toHaveBeenCalledWith('[logger] provider "boom" failed:', expect.any(Error));
    spy.mockRestore();
  });
});

describe('isEnabled', () => {
  it('reports per-level and overall enablement', () => {
    const log = createLogger({ providers: [], level: 'warn' });
    expect(log.isEnabled()).toBe(true);
    expect(log.isEnabled('debug')).toBe(false);
    expect(log.isEnabled('warn')).toBe(true);
    expect(log.isEnabled('error')).toBe(true);
  });

  it('reports false for everything when disabled', () => {
    const log = createLogger({ providers: [], enabled: false });
    expect(log.isEnabled()).toBe(false);
    expect(log.isEnabled('error')).toBe(false);
  });
});

describe('prefixes and child loggers', () => {
  it('passes the prefix to providers', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider], prefix: 'cart' });
    log.info('added', 42);
    expect(records).toEqual([{ level: 'info', prefix: 'cart', args: ['added', 42] }]);
  });

  it('joins child prefixes with ":"', () => {
    const { provider, records } = recordingProvider();
    const log = createLogger({ providers: [provider], prefix: 'cart' });
    log.child('checkout').info('paid');
    expect(records).toEqual([{ level: 'info', prefix: 'cart:checkout', args: ['paid'] }]);
  });

  it('inherits providers, enabled switch, and current level, but overrides independently', () => {
    const off = recordingProvider();
    createLogger({ providers: [off.provider], enabled: false })
      .child('checkout')
      .error('never emitted');
    expect(off.records).toEqual([]);

    const { provider, records } = recordingProvider();
    const parent = createLogger({ providers: [provider], level: 'error' });
    const child = parent.child('sub', { level: 'debug' });
    child.debug('emitted');
    expect(records).toEqual([{ level: 'debug', prefix: 'sub', args: ['emitted'] }]);
    parent.debug('still suppressed');
    expect(records).toHaveLength(1);
  });
});
