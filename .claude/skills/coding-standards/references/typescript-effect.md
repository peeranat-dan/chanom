# TypeScript conventions for Effect

Additions on top of `typescript.md` for code that uses Effect - read that file
first; these do not replace it. Effect's own guide, `node_modules/effect/AGENTS.md`,
is the upstream source; these files record how this repo applies it. For the runtime patterns (services, errors,
layers) see `effect-ts.md`; this file is only about the type-level and
import-level conventions.

## tsconfig

Enable the Effect language-service plugin so editor diagnostics and refactors
understand Effect types:

```jsonc
{
  "compilerOptions": {
    "plugins": [{ "name": "@effect/language-service" }]
  }
}
```

## Imports

- Import from the package barrels, not deep paths:

  ```ts
  import { Effect, Option, Layer, Schema } from 'effect';
  import { FileSystem, Path } from 'effect';
  ```

- Keep type-only Effect imports under `import type`, grouped before value
  imports:

  ```ts
  import type { PlatformError } from 'effect';

  import { Effect } from 'effect';
  ```

## Typing effectful values

- When an exported effectful function needs an explicit return type, annotate
  it: `Effect.fn.Return<A, E, R>` inside `Effect.fn`, `Effect.Effect<A, E, R>`
  on plain arrow functions. Let inference handle locals.

  ```ts
  export const read = Effect.fn('store.read')(function* (
    key: string,
  ): Effect.fn.Return<string, PlatformError.PlatformError, FileSystem.FileSystem> {
    …
  });
  ```

- Declare tagged-error payloads as `Schema` fields on `Schema.TaggedError`:

  ```ts
  export class WriteFailed extends Schema.TaggedError<WriteFailed>()('WriteFailed', {
    key: Schema.String,
  }) {}
  ```

- Derive a data type from its schema rather than writing a parallel interface:
  `export const Pkg = Schema.Struct({ … })` plus
  `export type Pkg = typeof Pkg.Type`.

- Return service capability records `as const` so each method keeps its precise
  signature.
- Model "maybe present" values flowing through Effect with `Option<T>`
  (`Option.isSome(x)`, `x.value`) rather than `T | undefined`.
- Name traced spans after the function they wrap, prefixed by their module:
  `Effect.fn('config.apply')`.
