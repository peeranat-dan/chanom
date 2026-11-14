import type { ResolvedConfig } from 'vite';

import { describe, expect, it } from 'vitest';

import { EnvValidationError } from '../src/env-validation-error.ts';
import { envPlugin, findUnexposedKeys } from '../src/vite.ts';
import { optionalString, string } from './support/schema.ts';

const runConfigResolved = (
  plugin: ReturnType<typeof envPlugin>,
  config: Pick<ResolvedConfig, 'env' | 'envPrefix'>,
): void => {
  const hook = plugin.configResolved;
  if (typeof hook !== 'function') throw new TypeError('expected a configResolved function');
  // The plugin reads only `env` and `envPrefix`; a full ResolvedConfig is irrelevant here.
  void hook.call(undefined as never, config as ResolvedConfig);
};

describe('findUnexposedKeys', () => {
  it('flags keys without the default VITE_ prefix', () => {
    expect(findUnexposedKeys({ VITE_A: string(), API_KEY: string() }, undefined)).toEqual([
      { key: 'API_KEY', message: 'not exposed to client code; rename it to start with "VITE_"' },
    ]);
  });

  it('accepts any of several custom prefixes', () => {
    expect(
      findUnexposedKeys({ APP_A: string(), PUBLIC_B: string(), C: string() }, ['APP_', 'PUBLIC_']),
    ).toEqual([
      {
        key: 'C',
        message: 'not exposed to client code; rename it to start with "APP_" or "PUBLIC_"',
      },
    ]);
  });

  it("allows Vite's built-in keys without a prefix", () => {
    expect(findUnexposedKeys({ MODE: string(), DEV: string() }, 'VITE_')).toEqual([]);
  });
});

describe('envPlugin', () => {
  it('passes when the loaded env matches the schema', () => {
    const plugin = envPlugin({ schema: { VITE_A: string(), VITE_B: optionalString() } });

    expect(() =>
      runConfigResolved(plugin, { env: { VITE_A: 'x', MODE: 'test' }, envPrefix: 'VITE_' }),
    ).not.toThrow();
  });

  it('fails with the validation issues when a variable is invalid', () => {
    const plugin = envPlugin({ schema: { VITE_A: string() } });

    expect(() => runConfigResolved(plugin, { env: {}, envPrefix: 'VITE_' })).toThrow(
      new EnvValidationError([{ key: 'VITE_A', message: 'expected a string' }]),
    );
  });

  it('reports unexposed keys before validating values', () => {
    const plugin = envPlugin({ schema: { SECRET: string() } });

    expect(() => runConfigResolved(plugin, { env: {}, envPrefix: undefined })).toThrow(
      /SECRET: not exposed to client code/,
    );
  });
});
