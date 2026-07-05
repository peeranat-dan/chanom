import type { PlatformError } from '@effect/platform/Error';

import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

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
      isRepo: (cwd: string) => fs.exists(path.join(cwd, '.git')),
      writeGitignore: (cwd: string, contents = 'node_modules\n') =>
        fs.writeFileString(path.join(cwd, '.gitignore'), contents),
    } as const;
  }),
}) {}
