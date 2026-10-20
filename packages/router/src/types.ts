/**
 * Augment this interface with your app's paths to type every API in this package.
 * The Vite plugin (`@chanom/router/vite`) generates it from your pages folder:
 *
 * ```ts
 * declare module '@chanom/router' {
 *   interface Register {
 *     paths: '/' | '/posts/:id';
 *   }
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-empty-interface -- filled in by declaration merging.
export interface Register {}

/** Every registered path pattern, or `string` before the app registers any. */
export type Path = Register extends { readonly paths: infer P extends string } ? P : string;

type Segments<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? Head | Segments<Tail>
  : P;

type RequiredKey<S> = S extends `:${string}?` ? never : S extends `:${infer Name}` ? Name : never;

type OptionalKey<S> = S extends `:${infer Name}?` ? Name : never;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** The params of a path pattern: `Params<'/posts/:id'>` is `{ id: string }`. */
export type Params<P extends string> = string extends P
  ? Readonly<Record<string, string | undefined>>
  : Simplify<
      { readonly [K in RequiredKey<Segments<P>>]: string } & {
        readonly [K in OptionalKey<Segments<P>>]?: string;
      } & ('*' extends Segments<P> ? { readonly '*': string } : unknown)
    >;

export type SearchValue = string | number | boolean | null | undefined;

export type SearchInit =
  | string
  | URLSearchParams
  | Readonly<Record<string, SearchValue | readonly SearchValue[]>>;

/** Search params to change, keyed like `T`. `null` or `undefined` removes a key; arrays repeat it. */
export type SearchUpdate<T = Readonly<Record<string, unknown>>> = {
  readonly [K in keyof T]?: SearchValue | readonly SearchValue[];
};

/** `params` is required exactly when the path has a required param. */
export type ParamsOption<P extends string> =
  {} extends Params<P> ? { readonly params?: Params<P> } : { readonly params: Params<P> };

export type HrefOptions<P extends string> = ParamsOption<P> & {
  readonly search?: SearchInit;
  readonly hash?: string;
};

/** Rest-args form of {@link HrefOptions}: optional unless the path has a required param. */
export type HrefArgs<P extends string, Extra = unknown> =
  {} extends Params<P> ? [options?: HrefOptions<P> & Extra] : [options: HrefOptions<P> & Extra];
