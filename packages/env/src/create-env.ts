import type { CreateEnvOptions, Env, EnvSchema } from './types.ts';

import { EnvValidationError } from './env-validation-error.ts';
import { validateEnv } from './validate-env.ts';

/**
 * Validate `runtimeEnv` against `schema` and return a frozen, typed env object.
 * Throws an {@link EnvValidationError} listing every invalid variable, so a
 * misconfigured app fails at startup instead of deep inside a request.
 *
 * @example
 * import { z } from "zod";
 *
 * export const env = createEnv({
 *   schema: { VITE_API_URL: z.url(), VITE_SENTRY_DSN: z.string().optional() },
 *   runtimeEnv: import.meta.env,
 * });
 * env.VITE_API_URL; // string
 */
export function createEnv<Schema extends EnvSchema>(
  options: CreateEnvOptions<Schema>,
): Env<Schema> {
  const result = validateEnv(options.schema, options.runtimeEnv, options);
  if (!result.ok) throw new EnvValidationError(result.issues);
  return result.env;
}
