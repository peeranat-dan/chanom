import { Cause, Chunk, Data, Effect, Logger, LogLevel } from 'effect';

import { brew } from './commands/brew/index.ts';
import { Cancelled, Prompter } from './services/prompter.ts';

export class UnknownCommand extends Data.TaggedError('UnknownCommand')<{
  readonly command: string | undefined;
}> {}

export interface RunOptions {
  /** When true, emits debug logs for each step and a full failure trace on error. */
  readonly debug?: boolean;
}

const commands = {
  brew,
} as const;

const dispatch = (name: string | undefined, cwd: string) =>
  Effect.gen(function* () {
    if (name !== undefined && Object.hasOwn(commands, name)) {
      return yield* commands[name as keyof typeof commands](cwd).pipe(Effect.withSpan(name));
    }
    return yield* new UnknownCommand({ command: name });
  });

const reportError = (message: string) =>
  Effect.gen(function* () {
    const prompter = yield* Prompter;
    yield* prompter.error(message);
    return 1;
  });

const isCancellation = (cause: Cause.Cause<unknown>) =>
  Chunk.isEmpty(Cause.defects(cause)) &&
  Chunk.every(Cause.failures(cause), (failure) => failure instanceof Cancelled);

/** Prints the fully rendered cause, including the span trace of the failing step. */
const traceFailure = (cause: Cause.Cause<unknown>) =>
  Effect.gen(function* () {
    if (isCancellation(cause)) return;
    const prompter = yield* Prompter;
    yield* prompter.debug(Cause.pretty(cause));
  });

/** Runs the named command and returns the process exit code. */
export const run = (
  name: string | undefined,
  cwd: string = process.cwd(),
  options: RunOptions = {},
) => {
  const debug = options.debug ?? false;

  return dispatch(name, cwd).pipe(
    Effect.as(0),
    debug ? Effect.tapErrorCause(traceFailure) : (effect) => effect,
    Effect.catchTags({
      Cancelled: () => Effect.succeed(0),
      UnknownCommand: (e) =>
        reportError(
          `Unknown command: ${e.command ?? '(none)'}\nAvailable commands: ${Object.keys(commands).join(', ')}`,
        ),
      PkgNotFound: (e) =>
        reportError(`No package.json found in ${e.cwd}. Run this inside a project.`),
      PkgInvalid: (e) => reportError(`Could not parse ${e.pkgPath}. Is it valid JSON?`),
      InstallFailed: (e) => reportError(`Package installation with ${e.pm} failed.`),
      HuskyInitFailed: (e) => reportError(`\`husky init\` failed (exit code ${e.exitCode}).`),
    }),
    Effect.catchAll((e) => reportError(`Unexpected error: ${e.message}`)),
    Logger.withMinimumLogLevel(debug ? LogLevel.Debug : LogLevel.Info),
  );
};
