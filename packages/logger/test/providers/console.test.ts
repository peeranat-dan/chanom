import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LOG_LEVELS, type LogLevel, consoleProvider } from '../../src/index.ts';

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

describe('consoleProvider', () => {
  it('writes each level to the matching console method', () => {
    const provider = consoleProvider();
    for (const level of LOG_LEVELS) {
      provider.log({ level, args: ['message', 42] });
      expect(spies[level]).toHaveBeenCalledWith('message', 42);
    }
  });

  it('prints the prefix as "[prefix]" before the record', () => {
    consoleProvider().log({ level: 'info', prefix: 'cart:checkout', args: ['paid'] });
    expect(spies.info).toHaveBeenCalledWith('[cart:checkout]', 'paid');
  });
});
