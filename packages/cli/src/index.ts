#!/usr/bin/env node
import { CommandRunner, Git, Prompter } from '@chanom/internal';
import { NodeServices, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Logger } from 'effect';

import { run } from './cli.ts';
import { PackageInstaller } from './services/package-installer.ts';

const args = process.argv.slice(2);
const debug = args.includes('--debug');
const command = args.find((arg) => !arg.startsWith('--'));

const ServicesLive = Layer.mergeAll(Prompter.layer, Git.layer, PackageInstaller.layer).pipe(
  Layer.provideMerge(CommandRunner.layer),
  Layer.provideMerge(NodeServices.layer),
);

// Debug logs go to stderr so they never interleave with prompt rendering on stdout.
const DebugLoggerLive = Layer.merge(
  Logger.layer([Logger.consolePretty(), Logger.tracerLogger]),
  Layer.succeed(Logger.LogToStderr, true),
);

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

NodeRuntime.runMain(program, { disableErrorReporting: true });
