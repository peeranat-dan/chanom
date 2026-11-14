import type { StandardSchemaV1 } from '../../src/standard-schema.ts';

/**
 * Minimal hand-rolled Standard Schemas, so tests exercise the spec contract
 * itself instead of one vendor's implementation of it.
 */
const schema = <Output>(
  validate: (value: unknown) => StandardSchemaV1.Result<Output>,
): StandardSchemaV1<unknown, Output> => ({
  '~standard': { version: 1, vendor: 'test', validate },
});

const fail = (message: string): StandardSchemaV1.FailureResult => ({ issues: [{ message }] });

export const string = (): StandardSchemaV1<unknown, string> =>
  schema((value) => (typeof value === 'string' ? { value } : fail('expected a string')));

export const optionalString = (): StandardSchemaV1<unknown, string | undefined> =>
  schema((value) =>
    value === undefined || typeof value === 'string' ? { value } : fail('expected a string'),
  );

/** Coerces a numeric string, like `z.coerce.number()`. */
export const port = (fallback: number): StandardSchemaV1<unknown, number> =>
  schema((value) => {
    if (value === undefined) return { value: fallback };
    const parsed = Number(value);
    return Number.isInteger(parsed) ? { value: parsed } : fail('expected an integer');
  });

export const asyncString = (): StandardSchemaV1<unknown, string> => ({
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: async (value) => ({ value: String(value) }),
  },
});

/** Always fails at `path`, like a JSON schema rejecting one field of the parsed object. */
export const nested = (path: StandardSchemaV1.Issue['path']): StandardSchemaV1<unknown, never> =>
  schema(() => ({ issues: [{ message: 'expected a number', path }] }));

/**
 * Validates asynchronously but returns a hand-made thenable instead of a real
 * Promise, like a promise from another realm would look to `instanceof`.
 */
export const thenableString = (): StandardSchemaV1<unknown, string> => {
  const thenable = (value: unknown) => ({
    then: (resolve: (result: StandardSchemaV1.Result<string>) => void) =>
      resolve({ value: String(value) }),
  });

  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      // The spec types the async return as a real Promise, so a plain thenable needs a cast.
      validate: (value) => thenable(value) as unknown as Promise<StandardSchemaV1.Result<string>>,
    },
  };
};
