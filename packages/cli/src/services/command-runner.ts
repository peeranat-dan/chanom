import type { PlatformError } from '@effect/platform/Error';

import { Command, CommandExecutor } from '@effect/platform';
import { Effect, Stream } from 'effect';

export interface CommandOutput {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const collectText = (stream: Stream.Stream<Uint8Array, PlatformError>) =>
  stream.pipe(Stream.decodeText(), Stream.mkString);

/**
 * Low-level process execution. Everything that shells out (git, package
 * managers, husky) goes through this service so commands can be stubbed in tests.
 */
export class CommandRunner extends Effect.Service<CommandRunner>()('cli/CommandRunner', {
  effect: Effect.gen(function* () {
    const executor = yield* CommandExecutor.CommandExecutor;

    const make = (cmd: string, args: readonly string[], cwd: string) =>
      Command.make(cmd, ...args).pipe(Command.workingDirectory(cwd));

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
    ): Effect.Effect<CommandOutput, PlatformError> =>
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.logDebug(`spawning \`${cmd} ${args.join(' ')}\` in ${cwd}`);
          const proc = yield* executor.start(make(cmd, args, cwd));
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
    ): Effect.Effect<number, PlatformError> =>
      traced(
        cmd,
        args,
        cwd,
        make(cmd, args, cwd).pipe(
          Command.exitCode,
          Effect.provideService(CommandExecutor.CommandExecutor, executor),
        ),
      );

    const execInherit = (
      cmd: string,
      args: readonly string[],
      cwd: string,
    ): Effect.Effect<number, PlatformError> =>
      traced(
        cmd,
        args,
        cwd,
        make(cmd, args, cwd).pipe(
          Command.stdout('inherit'),
          Command.stderr('inherit'),
          Command.exitCode,
          Effect.provideService(CommandExecutor.CommandExecutor, executor),
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
}) {}
