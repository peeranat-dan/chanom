#!/usr/bin/env node
import { log } from '@clack/prompts';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Data, Effect } from 'effect';

import { brew } from './commands/brew/index.ts';

const command = process.argv[2];

class UnknownCommand extends Data.TaggedError('UnknownCommand')<{
  readonly command: string | undefined;
}> {}

const commands = {
  brew,
} as const;

const dispatch = (name: string | undefined) =>
  Effect.gen(function* () {
    if (name !== undefined && Object.hasOwn(commands, name)) {
      return yield* commands[name as keyof typeof commands]();
    }
    return yield* new UnknownCommand({ command: name });
  });

const program = dispatch(command).pipe(
  Effect.catchTags({
    Cancelled: () => Effect.void,
    UnknownCommand: (e) =>
      Effect.sync(() => {
        log.error(
          `Unknown command: ${e.command ?? '(none)'}\nAvailable commands: ${Object.keys(commands).join(', ')}`,
        );
        process.exitCode = 1;
      }),
    PkgNotFound: (e) =>
      Effect.sync(() => {
        log.error(`No package.json found in ${e.cwd}. Run this inside a project.`);
        process.exitCode = 1;
      }),
    InstallFailed: (e) =>
      Effect.sync(() => {
        log.error(`Package installation with ${e.pm} failed.`);
        process.exitCode = 1;
      }),
    HuskyInitFailed: (e) =>
      Effect.sync(() => {
        log.error(`\`husky init\` failed (exit code ${e.exitCode}).`);
        process.exitCode = 1;
      }),
  }),
  Effect.catchAll((e) =>
    Effect.sync(() => {
      log.error(`Unexpected error: ${e.message}`);
      process.exitCode = 1;
    }),
  ),
  Effect.provide(NodeContext.layer),
);

NodeRuntime.runMain(program, { disableErrorReporting: true, disablePrettyLogger: true });
