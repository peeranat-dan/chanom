import type { CommandExecutor } from '@effect/platform/CommandExecutor';
import type { PlatformError } from '@effect/platform/Error';

import { Command, FileSystem, Path } from '@effect/platform';
import { Effect, Stream } from 'effect';

export interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

const collectText = (stream: Stream.Stream<Uint8Array, PlatformError>) =>
  stream.pipe(Stream.decodeText(), Stream.mkString);

const run = (args: string[], cwd: string) =>
  Effect.scoped(
    Effect.gen(function* () {
      const proc = yield* Command.start(
        Command.make('git', ...args).pipe(Command.workingDirectory(cwd)),
      );
      const [exitCode, stdout, stderr] = yield* Effect.all(
        [proc.exitCode, collectText(proc.stdout), collectText(proc.stderr)],
        { concurrency: 3 },
      );
      return { ok: exitCode === 0, stdout: stdout.trim(), stderr: stderr.trim() };
    }),
  );

const exitOk = (args: string[], cwd: string) =>
  Command.make('git', ...args).pipe(
    Command.workingDirectory(cwd),
    Command.exitCode,
    Effect.map((code) => code === 0),
  );

export const init = (cwd: string): Effect.Effect<GitResult, PlatformError, CommandExecutor> =>
  run(['init'], cwd);

export const stageAll = (cwd: string): Effect.Effect<GitResult, PlatformError, CommandExecutor> =>
  run(['add', '.'], cwd);

export const commit = (
  cwd: string,
  message: string,
): Effect.Effect<GitResult, PlatformError, CommandExecutor> => run(['commit', '-m', message], cwd);

export const hasIdentity = (cwd: string): Effect.Effect<boolean, PlatformError, CommandExecutor> =>
  exitOk(['var', 'GIT_COMMITTER_IDENT'], cwd);

export const setLocalIdentity = (
  cwd: string,
  name: string,
  email: string,
): Effect.Effect<void, PlatformError, CommandExecutor> =>
  run(['config', 'user.name', name], cwd).pipe(
    Effect.andThen(() => run(['config', 'user.email', email], cwd)),
    Effect.asVoid,
  );

export const hasStagedChanges = (
  cwd: string,
): Effect.Effect<boolean, PlatformError, CommandExecutor> =>
  exitOk(['diff', '--cached', '--quiet'], cwd).pipe(Effect.map((ok) => !ok));

export const isGitRepo = (cwd: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    return yield* fs.exists(path.join(cwd, '.git'));
  });

export const writeGitignore = (cwd: string, contents = 'node_modules\n') =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    yield* fs.writeFileString(path.join(cwd, '.gitignore'), contents);
  });
