import type { PlatformError } from '@effect/platform/Error';

import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import { CommandRunner } from './command-runner.ts';

export interface GitResult {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

/** Git operations, built on top of {@link CommandRunner}. */
export class Git extends Effect.Service<Git>()('cli/Git', {
  effect: Effect.gen(function* () {
    const runner = yield* CommandRunner;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const run = (args: readonly string[], cwd: string): Effect.Effect<GitResult, PlatformError> =>
      runner
        .capture('git', args, cwd)
        .pipe(
          Effect.map(({ exitCode, stdout, stderr }) => ({ ok: exitCode === 0, stdout, stderr })),
        );

    const exitOk = (args: readonly string[], cwd: string) =>
      runner.exitCode('git', args, cwd).pipe(Effect.map((code) => code === 0));

    return {
      init: (cwd: string) => run(['init'], cwd),
      stageAll: (cwd: string) => run(['add', '.'], cwd),
      commit: (cwd: string, message: string) => run(['commit', '-m', message], cwd),
      hasIdentity: (cwd: string) => exitOk(['var', 'GIT_COMMITTER_IDENT'], cwd),
      setLocalIdentity: (cwd: string, name: string, email: string) =>
        run(['config', 'user.name', name], cwd).pipe(
          Effect.andThen(() => run(['config', 'user.email', email], cwd)),
          Effect.asVoid,
        ),
      hasStagedChanges: (cwd: string) =>
        exitOk(['diff', '--cached', '--quiet'], cwd).pipe(Effect.map((clean) => !clean)),
      /**
       * True when `cwd` is anywhere inside a git work tree — a `.git` folder
       * check would miss subdirectories (e.g. workspace packages) and lead to
       * nested `git init` calls.
       */
      isRepo: (cwd: string) => exitOk(['rev-parse', '--is-inside-work-tree'], cwd),
      /** Path of `cwd` relative to the work-tree root: empty at the root, `None` outside a repository. */
      prefix: (cwd: string) =>
        run(['rev-parse', '--show-prefix'], cwd).pipe(
          Effect.map((result) => (result.ok ? Option.some(result.stdout) : Option.none())),
        ),
      /** Absolute path of the work-tree root, or `None` outside a repository. */
      root: (cwd: string) =>
        run(['rev-parse', '--show-toplevel'], cwd).pipe(
          Effect.map((result) => (result.ok ? Option.some(result.stdout) : Option.none())),
        ),
      writeGitignore: (cwd: string, contents = 'node_modules\n') =>
        fs.writeFileString(path.join(cwd, '.gitignore'), contents),
      readGitignore: (cwd: string) => fs.readFileString(path.join(cwd, '.gitignore')),
    } as const;
  }),
}) {}
