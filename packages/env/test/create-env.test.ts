import { describe, expect, expectTypeOf, it } from 'vitest';

import { createEnv } from '../src/create-env.ts';
import { EnvValidationError } from '../src/env-validation-error.ts';
import { port, string } from './support/schema.ts';

describe('createEnv', () => {
  it('returns the typed env when every variable is valid', () => {
    const env = createEnv({
      schema: { VITE_API_URL: string(), VITE_PORT: port(3000) },
      runtimeEnv: { VITE_API_URL: 'https://api.test' },
    });

    expect(env).toEqual({ VITE_API_URL: 'https://api.test', VITE_PORT: 3000 });
  });

  it('throws an EnvValidationError listing every invalid variable', () => {
    const run = (): unknown =>
      createEnv({
        schema: { VITE_API_URL: string(), VITE_PORT: port(3000) },
        runtimeEnv: { VITE_PORT: 'abc' },
      });

    expect(run).toThrow(EnvValidationError);
    expect(run).toThrow(
      'Invalid environment variables:\n  - VITE_API_URL: expected a string\n  - VITE_PORT: expected an integer',
    );
  });

  it('never puts the invalid value in the error', () => {
    const run = (): unknown =>
      createEnv({ schema: { VITE_PORT: port(3000) }, runtimeEnv: { VITE_PORT: 'secret-token' } });

    expect(run).not.toThrow(/secret-token/);
  });
});

describe('createEnv types', () => {
  it('types each key as its schema output', () => {
    const env = createEnv({
      schema: { VITE_API_URL: string(), VITE_PORT: port(3000) },
      runtimeEnv: { VITE_API_URL: 'x' },
    });

    expectTypeOf(env).toEqualTypeOf<{
      readonly VITE_API_URL: string;
      readonly VITE_PORT: number;
    }>();
  });
});
