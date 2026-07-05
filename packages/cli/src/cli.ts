import { Data, Effect } from 'effect';

import { brew } from './commands/brew/index.ts';
import { Prompter } from './services/prompter.ts';

export class UnknownCommand extends Data.TaggedError('UnknownCommand')<{
  readonly command: string | undefined;
}> {}

const commands = {
  brew,
} as const;

const dispatch = (name: string | undefined, cwd: string) =>
  Effect.gen(function* () {
    if (name !== undefined && Object.hasOwn(commands, name)) {
      return yield* commands[name as keyof typeof commands](cwd);
    }
    return yield* new UnknownCommand({ command: name });
  });

const reportError = (message: string) =>
  Effect.gen(function* () {
    const prompter = yield* Prompter;
    yield* prompter.error(message);
    return 1;
  });

/** Runs the named command and returns the process exit code. */
export const run = (name: string | undefined, cwd: string = process.cwd()) =>
  dispatch(name, cwd).pipe(
    Effect.as(0),
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
  );
