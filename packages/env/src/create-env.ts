import type { CreateEnvOptions, EmptyEnvSchema, Env, EnvSchema } from './types.ts';

import { EnvValidationError } from './env-validation-error.ts';
import { validateEnv } from './validate-env.ts';

// `in` rather than `typeof window`, so this compiles without the DOM lib.
const detectServer = (): boolean => !('window' in globalThis);

/**
 * Throw on any read of a server-only key, so a secret used in client code fails
 * loudly instead of quietly reading `undefined`.
 */
const guardServerKeys = <Shape extends object>(
  env: Shape,
  serverKeys: ReadonlySet<string>,
): Shape =>
  new Proxy(env, {
    get(target, key, receiver) {
      if (typeof key === 'string' && serverKeys.has(key)) {
        throw new Error(`Attempted to read server-only env "${key}" on the client.`);
      }
      return Reflect.get(target, key, receiver);
    },
  });

/**
 * Validate `runtimeEnv` against the `server` and `client` schemas and return a
 * frozen, typed env object. Throws an {@link EnvValidationError} listing every
 * invalid variable, so a misconfigured app fails at startup instead of deep
 * inside a request.
 *
 * On the client (see `isServer`), only `client` variables are validated, and
 * reading a `server` variable throws.
 *
 * @example
 * import { z } from "zod";
 *
 * export const env = createEnv({
 *   server: { DATABASE_URL: z.url() },
 *   client: { VITE_API_URL: z.url() },
 *   runtimeEnv: process.env,
 * });
 * env.DATABASE_URL; // string
 */
export function createEnv<
  Server extends EnvSchema = EmptyEnvSchema,
  Client extends EnvSchema = EmptyEnvSchema,
>(options: CreateEnvOptions<Server, Client>): Env<Server & Client> {
  const server: EnvSchema = options.server ?? {};
  const client: EnvSchema = options.client ?? {};
  const isServer = options.isServer ?? detectServer();

  const result = validateEnv(
    isServer ? { ...server, ...client } : client,
    options.runtimeEnv,
    options,
  );
  if (!result.ok) throw new EnvValidationError(result.issues);

  // On the server both schemas were validated; on the client the server keys are
  // absent and the proxy throws on any read of them. A key declared in both
  // schemas was validated as a client var, so it stays readable.
  const env = result.env as Env<Server & Client>;
  if (isServer) return env;
  const serverOnlyKeys = Object.keys(server).filter((key) => !(key in client));
  return guardServerKeys(env, new Set(serverOnlyKeys));
}
