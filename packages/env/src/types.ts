import type { StandardSchemaV1 } from './standard-schema.ts';

/** One Standard Schema per environment variable, keyed by variable name. */
export type EnvSchema = Readonly<Record<string, StandardSchemaV1>>;

/** The validated env: each key typed as its schema's output. */
export type Env<Schema extends EnvSchema> = {
  readonly [Key in keyof Schema]: StandardSchemaV1.InferOutput<Schema[Key]>;
};

/** The raw variables to validate, e.g. `import.meta.env` or `process.env`. */
export type RuntimeEnv = Readonly<Record<string, unknown>>;

export interface ValidateEnvOptions {
  /**
   * Treat `''` as missing, so `VITE_FOO=` in a `.env` file falls through to the
   * schema's optional/default handling instead of passing as an empty string.
   * Defaults to `true`.
   */
  readonly emptyStringAsUndefined?: boolean;
}

/** A schema with no variables, the default for an omitted `server` or `client`. */
export type EmptyEnvSchema = Readonly<Record<never, never>>;

export interface CreateEnvOptions<
  Server extends EnvSchema = EmptyEnvSchema,
  Client extends EnvSchema = EmptyEnvSchema,
> extends ValidateEnvOptions {
  /** Variables only server code may read, e.g. secrets. Never validated on the client. */
  readonly server?: Server;
  /** Variables safe to ship to the browser. Validated on both sides. */
  readonly client?: Client;
  readonly runtimeEnv: RuntimeEnv;
  /**
   * Whether this code runs on the server. On the client, `server` variables are
   * skipped and reading one throws. Defaults to `true` when there is no global `window`.
   */
  readonly isServer?: boolean;
}

/** A variable that failed validation. Never carries the value, which may be a secret. */
export interface EnvIssue {
  readonly key: string;
  readonly message: string;
  /** Location inside the parsed value, for schemas that output nested objects. */
  readonly path?: readonly PropertyKey[];
}

export type ValidateEnvResult<Schema extends EnvSchema> =
  | { readonly ok: true; readonly env: Env<Schema> }
  | { readonly ok: false; readonly issues: readonly EnvIssue[] };
