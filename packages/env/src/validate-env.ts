import type { StandardSchemaV1 } from './standard-schema.ts';
import type {
  Env,
  EnvIssue,
  EnvSchema,
  RuntimeEnv,
  ValidateEnvOptions,
  ValidateEnvResult,
} from './types.ts';

const isPromise = (value: unknown): value is Promise<unknown> => value instanceof Promise;

const readValue = (runtimeEnv: RuntimeEnv, key: string, emptyAsUndefined: boolean): unknown => {
  const value = runtimeEnv[key];
  return emptyAsUndefined && value === '' ? undefined : value;
};

const validateOne = (
  key: string,
  schema: StandardSchemaV1,
  value: unknown,
): StandardSchemaV1.Result<unknown> => {
  const result = schema['~standard'].validate(value);
  // Env is read at module load, before anything could await it.
  if (isPromise(result)) {
    throw new TypeError(`Schema for "${key}" is async; env schemas must validate synchronously.`);
  }
  return result;
};

/**
 * Validate every key in `schema` against `runtimeEnv`, collecting all failures
 * instead of stopping at the first. Keys not in `schema` are dropped. Never
 * throws for invalid values; see {@link createEnv} for the throwing variant.
 */
export function validateEnv<Schema extends EnvSchema>(
  schema: Schema,
  runtimeEnv: RuntimeEnv,
  options: ValidateEnvOptions = {},
): ValidateEnvResult<Schema> {
  const emptyAsUndefined = options.emptyStringAsUndefined ?? true;
  const env: Record<string, unknown> = {};
  const issues: EnvIssue[] = [];

  for (const [key, keySchema] of Object.entries(schema)) {
    const result = validateOne(key, keySchema, readValue(runtimeEnv, key, emptyAsUndefined));
    if (result.issues === undefined) {
      env[key] = result.value;
    } else {
      issues.push(...result.issues.map((issue) => ({ key, message: issue.message })));
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  // Every schema key was assigned its own schema's output above.
  return { ok: true, env: Object.freeze(env) as Env<Schema> };
}
