import { describe, expect, it } from 'vitest';

import { validateEnv } from '../src/validate-env.ts';
import {
  asyncString,
  nested,
  optionalString,
  port,
  string,
  thenableString,
} from './support/schema.ts';

describe('validateEnv', () => {
  it('returns each schema output and drops keys outside the schema', () => {
    const result = validateEnv(
      { VITE_API_URL: string(), VITE_PORT: port(3000) },
      { VITE_API_URL: 'https://api.test', VITE_PORT: '8080', VITE_OTHER: 'x' },
    );

    expect(result).toEqual({
      ok: true,
      env: { VITE_API_URL: 'https://api.test', VITE_PORT: 8080 },
    });
  });

  it('freezes the returned env', () => {
    const result = validateEnv({ VITE_API_URL: string() }, { VITE_API_URL: 'x' });

    expect(result.ok && Object.isFrozen(result.env)).toBe(true);
  });

  it('collects every failing key instead of stopping at the first', () => {
    const result = validateEnv(
      { VITE_API_URL: string(), VITE_PORT: port(3000), VITE_KEY: string() },
      { VITE_PORT: 'abc' },
    );

    expect(result).toEqual({
      ok: false,
      issues: [
        { key: 'VITE_API_URL', message: 'expected a string' },
        { key: 'VITE_PORT', message: 'expected an integer' },
        { key: 'VITE_KEY', message: 'expected a string' },
      ],
    });
  });

  it('treats empty strings as missing by default', () => {
    const result = validateEnv(
      { VITE_DSN: optionalString(), VITE_PORT: port(3000) },
      { VITE_DSN: '', VITE_PORT: '' },
    );

    expect(result).toEqual({ ok: true, env: { VITE_DSN: undefined, VITE_PORT: 3000 } });
  });

  it('keeps empty strings when emptyStringAsUndefined is false', () => {
    const result = validateEnv(
      { VITE_DSN: optionalString() },
      { VITE_DSN: '' },
      { emptyStringAsUndefined: false },
    );

    expect(result).toEqual({ ok: true, env: { VITE_DSN: '' } });
  });

  it('throws for async schemas, which cannot run at module load', () => {
    expect(() => validateEnv({ VITE_KEY: asyncString() }, { VITE_KEY: 'x' })).toThrow(
      'Schema for "VITE_KEY" is async; env schemas must validate synchronously.',
    );
  });

  it('throws for schemas returning a non-native thenable', () => {
    expect(() => validateEnv({ VITE_KEY: thenableString() }, { VITE_KEY: 'x' })).toThrow(
      'Schema for "VITE_KEY" is async; env schemas must validate synchronously.',
    );
  });

  it('keeps issue paths, unwrapping path segment objects', () => {
    const result = validateEnv({ VITE_CONFIG: nested(['db', { key: 'port' }]) }, {});

    expect(result).toEqual({
      ok: false,
      issues: [{ key: 'VITE_CONFIG', message: 'expected a number', path: ['db', 'port'] }],
    });
  });

  it('omits the path when the issue has none', () => {
    const result = validateEnv({ VITE_CONFIG: nested([]) }, {});

    expect(!result.ok && result.issues[0]).not.toHaveProperty('path');
  });
});
