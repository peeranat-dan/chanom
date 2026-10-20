import { describe, expect, it } from 'vitest';

import tryCatch from '../../src/try-catch/index.ts';

describe('tryCatch', () => {
  it('wraps a resolved promise', async () => {
    await expect(tryCatch(Promise.resolve(42))).resolves.toEqual({ ok: true, data: 42 });
  });

  it('wraps a rejected promise', async () => {
    const error = new Error('boom');

    await expect(tryCatch(Promise.reject(error))).resolves.toEqual({ ok: false, error });
  });

  it('wraps the return value of a sync function', async () => {
    await expect(tryCatch(() => JSON.parse('{"a":1}') as unknown)).resolves.toEqual({
      ok: true,
      data: { a: 1 },
    });
  });

  it('catches a sync throw from a function', async () => {
    const result = await tryCatch(() => JSON.parse('{'));

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBeInstanceOf(SyntaxError);
  });

  it('catches a rejection from an async function', async () => {
    await expect(
      tryCatch(async () => {
        throw 'plain string';
      }),
    ).resolves.toEqual({ ok: false, error: 'plain string' });
  });
});
