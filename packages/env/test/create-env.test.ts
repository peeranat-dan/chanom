import { describe, expect, expectTypeOf, it } from 'vitest';

import { createEnv } from '../src/create-env.ts';
import { EnvValidationError } from '../src/env-validation-error.ts';
import { port, string } from './support/schema.ts';

describe('createEnv', () => {
  it('returns the typed env when every variable is valid', () => {
    const env = createEnv({
      client: { VITE_API_URL: string(), VITE_PORT: port(3000) },
      runtimeEnv: { VITE_API_URL: 'https://api.test' },
    });

    expect(env).toEqual({ VITE_API_URL: 'https://api.test', VITE_PORT: 3000 });
  });

  it('throws an EnvValidationError listing every invalid variable', () => {
    const run = (): unknown =>
      createEnv({
        client: { VITE_API_URL: string(), VITE_PORT: port(3000) },
        runtimeEnv: { VITE_PORT: 'abc' },
      });

    expect(run).toThrow(EnvValidationError);
    expect(run).toThrow(
      'Invalid environment variables:\n  - VITE_API_URL: expected a string\n  - VITE_PORT: expected an integer',
    );
  });

  it('never puts the invalid value in the error', () => {
    const run = (): unknown =>
      createEnv({ client: { VITE_PORT: port(3000) }, runtimeEnv: { VITE_PORT: 'secret-token' } });

    expect(run).not.toThrow(/secret-token/);
  });
});

describe('createEnv on the server', () => {
  it('validates server and client variables together', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      client: { VITE_API_URL: string() },
      runtimeEnv: { DATABASE_URL: 'postgres://db', VITE_API_URL: 'https://api.test' },
      isServer: true,
    });

    expect(env).toEqual({ DATABASE_URL: 'postgres://db', VITE_API_URL: 'https://api.test' });
  });

  it('fails when a server variable is missing', () => {
    expect(() =>
      createEnv({ server: { DATABASE_URL: string() }, runtimeEnv: {}, isServer: true }),
    ).toThrow(new EnvValidationError([{ key: 'DATABASE_URL', message: 'expected a string' }]));
  });

  it('defaults to the server when there is no global window', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      runtimeEnv: { DATABASE_URL: 'x' },
    });

    expect(env.DATABASE_URL).toBe('x');
  });
});

describe('createEnv on the client', () => {
  const clientEnv = (): { readonly DATABASE_URL: string; readonly VITE_API_URL: string } =>
    createEnv({
      server: { DATABASE_URL: string() },
      client: { VITE_API_URL: string() },
      runtimeEnv: { VITE_API_URL: 'https://api.test' },
      isServer: false,
    });

  it('skips server variables, which the client never receives', () => {
    expect(clientEnv().VITE_API_URL).toBe('https://api.test');
  });

  it('throws when client code reads a server variable', () => {
    const env = clientEnv();

    expect(() => env.DATABASE_URL).toThrow(
      'Attempted to read server-only env "DATABASE_URL" on the client.',
    );
  });

  it('still fails on an invalid client variable', () => {
    expect(() =>
      createEnv({ client: { VITE_API_URL: string() }, runtimeEnv: {}, isServer: false }),
    ).toThrow(new EnvValidationError([{ key: 'VITE_API_URL', message: 'expected a string' }]));
  });
});

describe('createEnv types', () => {
  it('types each key as its schema output, across both scopes', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      client: { VITE_API_URL: string(), VITE_PORT: port(3000) },
      runtimeEnv: { VITE_API_URL: 'x' },
      isServer: false,
    });

    expectTypeOf(env).toEqualTypeOf<{
      readonly DATABASE_URL: string;
      readonly VITE_API_URL: string;
      readonly VITE_PORT: number;
    }>();
  });

  it('types a server-only env without a client schema', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      runtimeEnv: { DATABASE_URL: 'x' },
    });

    expectTypeOf(env).toEqualTypeOf<{ readonly DATABASE_URL: string }>();
  });
});
