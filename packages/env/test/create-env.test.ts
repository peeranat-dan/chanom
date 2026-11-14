import { describe, expect, expectTypeOf, it } from 'vitest';

import { createEnv } from '../src/create-env.ts';
import { EnvValidationError } from '../src/env-validation-error.ts';
import { port, string } from './support/schema.ts';

describe('createEnv', () => {
  it('should return the typed env when every variable is valid', () => {
    const env = createEnv({
      client: { VITE_API_URL: string(), VITE_PORT: port(3000) },
      runtimeEnv: { VITE_API_URL: 'https://api.test' },
    });

    expect(env).toEqual({ VITE_API_URL: 'https://api.test', VITE_PORT: 3000 });
  });

  it('should throw an EnvValidationError listing every invalid variable', () => {
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

  it('should never put the invalid value in the error', () => {
    const run = (): unknown =>
      createEnv({ client: { VITE_PORT: port(3000) }, runtimeEnv: { VITE_PORT: 'secret-token' } });

    expect(run).not.toThrow(/secret-token/);
  });

  it('should validate server and client variables together on the server', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      client: { VITE_API_URL: string() },
      runtimeEnv: { DATABASE_URL: 'postgres://db', VITE_API_URL: 'https://api.test' },
      isServer: true,
    });

    expect(env).toEqual({ DATABASE_URL: 'postgres://db', VITE_API_URL: 'https://api.test' });
  });

  it('should fail when a server variable is missing on the server', () => {
    expect(() =>
      createEnv({ server: { DATABASE_URL: string() }, runtimeEnv: {}, isServer: true }),
    ).toThrow(new EnvValidationError([{ key: 'DATABASE_URL', message: 'expected a string' }]));
  });

  it('should default to the server when there is no global window', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      runtimeEnv: { DATABASE_URL: 'x' },
    });

    expect(env.DATABASE_URL).toBe('x');
  });

  describe('when running on the client', () => {
    const clientEnv = (): { readonly DATABASE_URL: string; readonly VITE_API_URL: string } =>
      createEnv({
        server: { DATABASE_URL: string() },
        client: { VITE_API_URL: string() },
        runtimeEnv: { VITE_API_URL: 'https://api.test' },
        isServer: false,
      });

    it('should skip server variables, which the client never receives', () => {
      expect(clientEnv().VITE_API_URL).toBe('https://api.test');
    });

    it('should throw when client code reads a server variable', () => {
      const env = clientEnv();

      expect(() => env.DATABASE_URL).toThrow(
        'Attempted to read server-only env "DATABASE_URL" on the client.',
      );
    });

    it('should still fail on an invalid client variable', () => {
      expect(() =>
        createEnv({ client: { VITE_API_URL: string() }, runtimeEnv: {}, isServer: false }),
      ).toThrow(new EnvValidationError([{ key: 'VITE_API_URL', message: 'expected a string' }]));
    });

    it('should let client code read a variable declared in both schemas', () => {
      const env = createEnv({
        server: { NODE_ENV: string() },
        client: { NODE_ENV: string() },
        runtimeEnv: { NODE_ENV: 'production' },
        isServer: false,
      });

      expect(env.NODE_ENV).toBe('production');
    });
  });

  it('should type each key as its schema output, across both scopes', () => {
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

  it('should type a server-only env without a client schema', () => {
    const env = createEnv({
      server: { DATABASE_URL: string() },
      runtimeEnv: { DATABASE_URL: 'x' },
    });

    expectTypeOf(env).toEqualTypeOf<{ readonly DATABASE_URL: string }>();
  });
});
