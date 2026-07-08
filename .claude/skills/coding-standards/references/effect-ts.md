# Effect-TS conventions

The `@chanom/cli` package is a layered Effect app. Keep the layers separate and
push every side effect through a service or `@effect/platform`.

## Layer boundaries

- `domain/` — pure data + functions, **no I/O, no Effect**. Plain values in,
  plain values out (`isEsm`, `getMismatchedPackage`, `planScripts`).
- `services/` — `Effect.Service` capabilities that wrap side effects
  (`Prompter`, `CommandRunner`, `Git`, `PackageInstaller`).
- `commands/<name>/logic.ts` — pure, synchronous decision logic returning plain
  data (`configFile`, `getScriptPlan`, `getPackages`).
- `commands/<name>/index.ts` — effectful orchestration that composes services
  and the pure `logic.ts`.
- `utils/` — shared Effect helpers over `FileSystem`/`Path` (`readPkg`, `detectPm`).

Never call `@clack/prompts`, `child_process`, or `node:fs` directly from a
command. Go through a service, or `FileSystem.FileSystem` / `Path.Path`.

## Services

Define with `Effect.Service<Self>()('cli/<Name>', …)`. The tag is always
namespaced `cli/<Name>`. Return the capability record `as const`.

Use `effect:` when the service needs to acquire dependencies:

```ts
export class Git extends Effect.Service<Git>()('cli/Git', {
  effect: Effect.gen(function* () {
    const runner = yield* CommandRunner;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    return {
      init: (cwd: string) => run(['init'], cwd),
      // …
    } as const;
  }),
}) {}
```

Use `succeed:` for a pure, dependency-free capability record (see `Prompter`):

```ts
export class Prompter extends Effect.Service<Prompter>()('cli/Prompter', {
  succeed: {
    intro: (message: string): Effect.Effect<void> => Effect.sync(() => clack.intro(message)),
    // …
  },
}) {}
```

Wrap a synchronous side effect in `Effect.sync`; wrap a promise in
`Effect.promise` (or `Effect.tryPromise` when it can reject meaningfully).

## Errors

Model expected failures as `Data.TaggedError`, one class per failure, with a
readonly payload. Put domain errors in `domain/`, service errors beside the
service, dispatch errors in `cli.ts`.

```ts
export class InstallFailed extends Data.TaggedError('InstallFailed')<{
  readonly pm: PackageManager;
}> {}
```

Convert a failed condition into a tagged error with `Effect.filterOrFail`:

```ts
runner.execInherit(pm, ['add', '-D', ...packages], cwd).pipe(
  Effect.filterOrFail((code) => code === 0, () => new InstallFailed({ pm })),
  Effect.asVoid,
);
```

Handle errors by tag, never by string matching:

- `Effect.catchTag('SystemError', (e) => …)` for one tag.
- `Effect.catchTags({ Cancelled: …, PkgNotFound: … })` for several.
- Recover a specific `SystemError.reason` (e.g. `NotFound`) and re-`Effect.fail`
  the rest — see `ensureGitIgnore` in `brew/index.ts`.

`cli.ts` is the single place that maps tagged errors to exit codes and
user-facing messages (`Effect.catchTags` + a final `Effect.catchAll`).

## Effectful functions

Name effectful helpers with `Effect.fn('<span>')` so they show up in traces:

```ts
const ensureGitRepo = Effect.fn('brew.ensureGitRepo')(function* (cwd: string) {
  const git = yield* Git;
  // …
});

export const apply = Effect.fn('add-knip.apply')(function* (cwd: string, esm: boolean, pkg: Pkg) {
  // …returns an updated Pkg, never mutates the input
});
```

- Acquire dependencies at the top of the generator: `const x = yield* Service`.
- `apply` functions return a **new** `Pkg`; the caller owns writing it back.
- Add spans to top-level command dispatch with `Effect.withSpan(name)`.
- Use `Effect.logDebug(...)` for step logging (surfaced only in `--debug`).
- Prefer `.pipe(...)` chains over deep nesting; `Effect.tapError` for cleanup
  (e.g. stopping a spinner) without swallowing the failure.

## Wiring layers

Live layers are wired once at the bin entry (`index.ts`) via `NodeContext`.
Compose with `.Default`, `Layer.provide`, and `Layer.mergeAll`:

```ts
Git.Default.pipe(Layer.provide(Layer.mergeAll(runnerLayer, fsLayer)));
```

## Values and imports

- Import from the barrels: `import { Effect, Data, Option, Layer } from 'effect'`,
  `import { FileSystem, Path } from '@effect/platform'`.
- Use `Option` for "maybe present" (`Option.isSome(x)`, `x.value`), not `null`.
- Keep concurrency explicit: `Effect.all([...], { concurrency: 3 })`.
