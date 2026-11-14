import { describe, expect, it } from 'vitest';

import { EnvValidationError } from '../src/env-validation-error.ts';

describe('EnvValidationError', () => {
  it('exposes the issues and formats one line per issue', () => {
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
});
