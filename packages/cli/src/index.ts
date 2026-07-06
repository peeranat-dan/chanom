#!/usr/bin/env node
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Logger } from 'effect';

import { run } from './cli.ts';
import { CommandRunner } from './services/command-runner.ts';
import { Git } from './services/git.ts';
import { PackageInstaller } from './services/package-installer.ts';
import { Prompter } from './services/prompter.ts';

const args = process.argv.slice(2);
const debug = args.includes('--debug');
const command = args.find((arg) => !arg.startsWith('--'));

const ServicesLive = Layer.mergeAll(Prompter.Default, Git.Default, PackageInstaller.Default).pipe(
  Layer.provideMerge(CommandRunner.Default),
  Layer.provideMerge(NodeContext.layer),
);

// Debug logs go to stderr so they never interleave with prompt rendering on stdout.
const DebugLoggerLive = Logger.replace(Logger.defaultLogger, Logger.prettyLogger({ stderr: true }));

const MainLive = debug ? Layer.merge(ServicesLive, DebugLoggerLive) : ServicesLive;

const program = run(command, process.cwd(), { debug }).pipe(
  Effect.flatMap((exitCode) =>
    Effect.sync(() => {
      if (exitCode !== 0) {
        process.exitCode = exitCode;
      }
    }),
  ),
  Effect.provide(MainLive),
);

NodeRuntime.runMain(program, { disableErrorReporting: true, disablePrettyLogger: true });
