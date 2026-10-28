import type { PlatformError } from 'effect';

import { Context, Effect, Layer, Stream } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';

export interface CommandOutput {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const collectText = (stream: Stream.Stream<Uint8Array, PlatformError.PlatformError>) =>
  stream.pipe(Stream.decodeText(), Stream.mkString);

/**
 * Low-level process execution. Everything that shells out (git, package
 * managers, husky) goes through this service so commands can be stubbed in tests.
 */
export class CommandRunner extends Context.Service<CommandRunner>()('internal/CommandRunner', {
  make: Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const traced = <E>(
      cmd: string,
      args: readonly string[],
      cwd: string,
      effect: Effect.Effect<number, E>,
    ): Effect.Effect<number, E> =>
      Effect.logDebug(`spawning \`${cmd} ${args.join(' ')}\` in ${cwd}`).pipe(
        Effect.andThen(effect),
        Effect.tap((code) => Effect.logDebug(`\`${cmd} ${args.join(' ')}\` exited with ${code}`)),
      );

    const capture = (
      cmd: string,
      args: readonly string[],
      cwd: string,
    ): Effect.Effect<CommandOutput, PlatformError.PlatformError> =>
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.logDebug(`spawning \`${cmd} ${args.join(' ')}\` in ${cwd}`);
          const proc = yield* spawner.spawn(ChildProcess.make(cmd, args, { cwd }));
          const [exitCode, stdout, stderr] = yield* Effect.all(
            [proc.exitCode, collectText(proc.stdout), collectText(proc.stderr)],
            { concurrency: 3 },
          );
          yield* Effect.logDebug(`\`${cmd} ${args.join(' ')}\` exited with ${exitCode}`);
          return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
        }),
      );

    const exitCode = (
      cmd: string,
      args: readonly string[],
      cwd: string,
    ): Effect.Effect<number, PlatformError.PlatformError> =>
      traced(cmd, args, cwd, spawner.exitCode(ChildProcess.make(cmd, args, { cwd })));

    const execInherit = (
      cmd: string,
      args: readonly string[],
      cwd: string,
    ): Effect.Effect<number, PlatformError.PlatformError> =>
      traced(
        cmd,
        args,
        cwd,
        spawner.exitCode(
          ChildProcess.make(cmd, args, { cwd, stdout: 'inherit', stderr: 'inherit' }),
        ),
      );

    return {
      /** Runs a command silently and collects its exit code and trimmed output. */
      capture,
      /** Runs a command silently and returns only its exit code. */
      exitCode,
      /** Runs a command with stdout/stderr forwarded to the user's terminal. */
      execInherit,
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
