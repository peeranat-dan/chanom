import type { Plugin } from 'vite';

import type { EnvIssue, EnvSchema, ValidateEnvOptions } from './types.ts';

import { EnvValidationError } from './env-validation-error.ts';
import { validateEnv } from './validate-env.ts';

export interface EnvPluginOptions extends ValidateEnvOptions {
  /** The `client` schema you give {@link createEnv}. */
  readonly client: EnvSchema;
}

/** Keys Vite always sets on `import.meta.env`, whatever `envPrefix` says. */
const BUILT_IN_KEYS: ReadonlySet<string> = new Set(['BASE_URL', 'MODE', 'DEV', 'PROD', 'SSR']);

const DEFAULT_PREFIX = 'VITE_';

const toPrefixes = (envPrefix: string | readonly string[] | undefined): readonly string[] => {
  if (envPrefix === undefined) return [DEFAULT_PREFIX];
  return typeof envPrefix === 'string' ? [envPrefix] : envPrefix;
};

/**
 * Keys Vite will never expose to client code, so validation at runtime would
 * only ever see `undefined` for them. Reported up front with the fix.
 */
export function findUnexposedKeys(
  schema: EnvSchema,
  envPrefix: string | readonly string[] | undefined,
): readonly EnvIssue[] {
  const prefixes = toPrefixes(envPrefix);
  return Object.keys(schema)
    .filter((key) => !BUILT_IN_KEYS.has(key) && !prefixes.some((prefix) => key.startsWith(prefix)))
    .map((key) => ({
      key,
      message: `not exposed to client code; rename it to start with ${prefixes.map((prefix) => `"${prefix}"`).join(' or ')}`,
    }));
}

/**
 * Validate the env Vite loads (`.env*` files plus the process env) when the
 * dev server starts or a build begins, so a missing variable fails the build
 * instead of shipping. Server variables are left to {@link createEnv} at
 * runtime, since the client bundle never sees them.
 *
 * @example
 * // vite.config.ts
 * import { envPlugin } from "@chanom/env/vite";
 * import { clientSchema } from "./src/env.schema.ts";
 *
 * export default createViteConfig({ plugins: [react(), envPlugin({ client: clientSchema })] });
 */
export function envPlugin(options: EnvPluginOptions): Plugin {
  return {
    name: 'chanom:env',
    configResolved(config) {
      const unexposed = findUnexposedKeys(options.client, config.envPrefix);
      if (unexposed.length > 0) throw new EnvValidationError(unexposed);

      const result = validateEnv(options.client, config.env, options);
      if (!result.ok) throw new EnvValidationError(result.issues);
    },
  };
}
