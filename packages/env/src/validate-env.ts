import type { StandardSchemaV1 } from './standard-schema.ts';
import type {
  Env,
  EnvIssue,
  EnvSchema,
  RuntimeEnv,
  ValidateEnvOptions,
  ValidateEnvResult,
} from './types.ts';

/**
 * True when `value` looks like a promise. We check for a `then` method instead
 * of using `instanceof Promise`, because promises from another realm (an
 * iframe, a VM context) or a custom promise library fail `instanceof`.
 */
const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  return 'then' in value && typeof value.then === 'function';
};

/** A path segment is either a plain key or an object wrapping one; return the key. */
const segmentKey = (segment: PropertyKey | StandardSchemaV1.PathSegment): PropertyKey =>
  typeof segment === 'object' ? segment.key : segment;

/**
 * Convert a schema issue into our own issue shape. The path is only kept when
 * it has segments, i.e. when the schema outputs a nested value and the failure
 * is somewhere inside it.
 */
const toEnvIssue = (key: string, issue: StandardSchemaV1.Issue): EnvIssue => {
  const path = issue.path ?? [];
  if (path.length === 0) return { key, message: issue.message };
  return { key, message: issue.message, path: path.map(segmentKey) };
};

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
  if (isPromiseLike(result)) {
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
      issues.push(...result.issues.map((issue) => toEnvIssue(key, issue)));
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  // Every schema key was assigned its own schema's output above.
  return { ok: true, env: Object.freeze(env) as Env<Schema> };
}
