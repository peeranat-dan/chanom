import { describe, expect, it } from 'vitest';

import { EnvValidationError } from '../src/env-validation-error.ts';

describe('EnvValidationError', () => {
  it('should expose the issues and format one line per issue', () => {
    const issues = [
      { key: 'VITE_A', message: 'required' },
      { key: 'VITE_B', message: 'expected a URL' },
    ];
    const error = new EnvValidationError(issues);

    expect(error.name).toBe('EnvValidationError');
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe(
      'Invalid environment variables:\n  - VITE_A: required\n  - VITE_B: expected a URL',
    );
  });

  it('should append the issue path to the key', () => {
    const error = new EnvValidationError([
      { key: 'VITE_CONFIG', message: 'expected a number', path: ['db', 0] },
    ]);

    expect(error.message).toBe(
      'Invalid environment variables:\n  - VITE_CONFIG.db.0: expected a number',
    );
  });
});
