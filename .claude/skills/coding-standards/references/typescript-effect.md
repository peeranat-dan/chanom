# TypeScript conventions for Effect

Additions on top of `typescript.md` for code that uses Effect — read that file
first; these do not replace it. For the runtime patterns (services, errors,
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
  import { Effect, Data, Option, Layer } from 'effect';
  import { FileSystem, Path } from '@effect/platform';
  ```

- Keep type-only Effect imports under `import type`, grouped before value
  imports:

  ```ts
  import type { PlatformError } from '@effect/platform/Error';

  import { Effect } from 'effect';
  ```

## Typing effectful values

- Annotate exported effectful functions with an explicit
  `Effect.Effect<A, E, R>` return type; let inference handle locals.

  ```ts
  const read = (key: string): Effect.Effect<string, PlatformError> => …;
  ```

- Type tagged-error payloads with a `readonly` record on `Data.TaggedError`:

  ```ts
  export class WriteFailed extends Data.TaggedError('WriteFailed')<{
    readonly key: string;
  }> {}
  ```

- Return service capability records `as const` so each method keeps its precise
  signature.
- Model "maybe present" values flowing through Effect with `Option<T>`
  (`Option.isSome(x)`, `x.value`) rather than `T | undefined`.
- Name traced spans after the function they wrap, prefixed by their module:
  `Effect.fn('config.apply')`.
