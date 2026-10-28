# Effect-TS conventions

Write layered Effect code and push every side effect through a service or
Effect's platform modules (`FileSystem`, `Path`, `ChildProcess`). Keep the layers separate.

## Layer boundaries

- **domain** - pure data + functions, **no I/O, no Effect**. Plain values in,
  plain values out.
- **services** - `Context.Service` capabilities that wrap side effects
  (terminal I/O, process spawning, network, `FileSystem`).
- **command / logic** - pure, synchronous decision logic returning plain data,
  kept in its own module.
- **command / orchestration** - effectful entry point that composes services
  with the pure logic.
- **utils** - shared Effect helpers over `FileSystem`/`Path`.

Never call a terminal-prompt library, `child_process`, or `node:fs` directly
from orchestration code. Go through a service, or `FileSystem.FileSystem` /
`Path.Path`.

## Services

Define with `Context.Service<Self>()('<namespace>/<Name>', { make })`. Namespace
the tag (`'<namespace>/<Name>'`) so it is unique across the app. Return the
capability record `as const`. v4 generates no layer, so every service declares
`static readonly layer = Layer.effect(this, this.make)` and leaves its
dependencies for the caller to provide.

Acquire dependencies inside `make`:

```ts
export class Store extends Context.Service<Store>()('<namespace>/Store', {
  make: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    return {
      read: (key: string) => fs.readFileString(path.join('/data', key)),
      write: (key: string, value: string) => fs.writeFileString(path.join('/data', key), value),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
```

Wrap a dependency-free capability record in `Effect.succeed`:

```ts
export class Log extends Context.Service<Log>()('<namespace>/Log', {
  make: Effect.succeed({
    info: (message: string): Effect.Effect<void> => Effect.sync(() => print(message)),
  } as const),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
```

Wrap a synchronous side effect in `Effect.sync`; wrap a promise in
`Effect.promise` (or `Effect.tryPromise` when it can reject meaningfully).

## Errors

Model expected failures as `Data.TaggedError`, one class per failure, with a
readonly payload. Keep each error next to the layer that raises it.

```ts
export class WriteFailed extends Data.TaggedError('WriteFailed')<{
  readonly key: string;
}> {}
```

Convert a failed condition into a tagged error with `Effect.filterOrFail`:

```ts
runner.run(cmd, args, cwd).pipe(
  Effect.filterOrFail((code) => code === 0, () => new CommandFailed({ cmd })),
  Effect.asVoid,
);
```

Handle errors by tag, never by string matching:

- `Effect.catchTag('PlatformError', (e) => …)` for one tag.
- `Effect.catchTags({ … })` for several.
- Recover one specific case (e.g. a missing file: `PlatformError` with
  `reason._tag === 'NotFound'`) and re-`Effect.fail` the rest.

Map tagged errors to exit codes and user-facing messages at a **single
top-level boundary** (`Effect.catchTags` + a final `Effect.catch`), not
scattered through the orchestration.

## Effectful functions

Name effectful helpers with `Effect.fn('<span>')` so they show up in traces:

```ts
const ensureReady = Effect.fn('ensureReady')(function* (cwd: string) {
  const store = yield* Store;
  // …
});
```

- Acquire dependencies at the top of the generator: `const x = yield* Service`.
- Functions that transform data return a **new** value; never mutate the input.
  The caller owns persisting it.
- Add spans to top-level dispatch with `Effect.withSpan(name)`.
- Use `Effect.logDebug(...)` for step logging (surfaced only in debug mode).
- Prefer `.pipe(...)` chains over deep nesting; `Effect.tapError` for cleanup
  (e.g. stopping a spinner) without swallowing the failure.

## Wiring layers

Wire live layers once at the entry point (via `NodeServices.layer` on Node). Compose
with each service's `.layer`, `Layer.provide`, and `Layer.mergeAll`:

```ts
Store.layer.pipe(Layer.provide(Layer.mergeAll(runnerLayer, fsLayer)));
```

## Values and imports

- Import from the barrels: `import { Effect, Data, Option, Layer } from 'effect'`,
  `import { FileSystem, Path } from 'effect'`, `import { ChildProcess } from 'effect/process'`.
- Use `Option` for "maybe present" (`Option.isSome(x)`, `x.value`), not `null`.
- Keep concurrency explicit: `Effect.all([...], { concurrency: 3 })`.
