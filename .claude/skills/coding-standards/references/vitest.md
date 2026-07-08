# Vitest conventions

Tests use **`@effect/vitest`** and live under `test/`, mirroring `src/` file for
file (`src/domain/pkg.ts` → `test/domain/pkg.test.ts`). New code in any layer
gets a matching test.

## Imports and layout

Always import the test API from `@effect/vitest`, not `vitest`:

```ts
import { describe, expect, it } from '@effect/vitest';
```

Group with `describe` per unit-under-test (usually one per exported function or
service), and write behaviour-focused `it` names ("flags mismatches in both
directions", "hasStagedChanges is true when git diff --cached exits non-zero").

## Pure code — plain `it`

Domain and `logic.ts` functions are pure, so test them directly. No Effect, no
layers, just assert on return values:

```ts
describe('isPackageInstalled', () => {
  it('finds packages in dependencies and devDependencies', () => {
    expect(isPackageInstalled({ dependencies: { oxlint: '1.0.0' } }, 'oxlint')).toBe(true);
  });
});
```

## Effectful code — `it.effect`

For services and command orchestration, use `it.effect`. Return an `Effect` that
does the work inside `Effect.gen`, and provide a test layer with
`.pipe(Effect.provide(layer))`:

```ts
it.effect('commit runs git commit and maps the exit code to ok', () => {
  const { layer, runner } = makeGitLayer(/* stubbed command handler */);
  return Effect.gen(function* () {
    const git = yield* Git;
    const result = yield* git.commit('/project', 'feat: hello');
    expect(result).toEqual({ ok: false, stdout: '', stderr: 'nothing to commit' });
  }).pipe(Effect.provide(layer));
});
```

## Test layers and stubs

Never hit the real filesystem, process, or terminal. Build the service under
test from its `.Default` and provide **in-memory stub layers** from
`test/support/`:

```ts
const makeGitLayer = (handler?: CommandHandler, fs: TestFs = makeTestFs()) => {
  const runner = makeTestRunner(handler);
  const layer = Git.Default.pipe(Layer.provide(Layer.mergeAll(runner.layer, fs.layer)));
  return { layer, runner, fs };
};
```

Reusable stubs live in `test/support/`: `makeTestFs` (Map-backed `FileSystem` +
posix `Path`), `makeTestRunner`, `makeTestPrompter`, `makeTestEnv`. Add new
stubs there rather than inlining them, and mirror their existing shape (return
`{ layer, …inspectables }`).

## Asserting

- **Return values / side effects:** inspect the stub's mutable state —
  `fs.files.get('/project/.gitignore')`, `runner.calls` (the recorded
  invocations). Assert full call arrays with `toEqual` to pin down args and cwd.
- **Failures:** flip the effect and assert on the tagged error rather than
  try/catch:

  ```ts
  const error = yield* Effect.flip(git.readGitignore('/project'));
  expect(error._tag).toBe('SystemError');
  expect(error._tag === 'SystemError' && error.reason).toBe('NotFound');
  ```

- Prefer specific matchers (`toBe`, `toEqual`, `toBeUndefined`) over truthiness.
- Script prompt answers and command outputs through the stub factories to cover
  both the happy path and each failure branch.

## Running

From the repo root: `pnpm turbo run test` (or `pnpm --filter @chanom/cli test`).
Tests must pass alongside `pnpm turbo run build` and `pnpm lint` before a change
is done.
