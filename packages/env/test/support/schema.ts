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
