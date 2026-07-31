#!/usr/bin/env node
import { CommandRunner, Git, Prompter } from '@chanom/internal';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Logger } from 'effect';
import { join } from 'node:path';

import { run } from './cli.ts';

// --debug is a runtime toggle, not a scaffolding flag; strip it before parsing.
const debug = process.argv.includes('--debug');
const argv = process.argv.slice(2).filter((arg) => arg !== '--debug');

// tsdown copies templates/ into dist/, so this resolves next to the bundle.
const templatesRoot = join(import.meta.dirname, 'templates');

const ServicesLive = Layer.mergeAll(Prompter.Default, Git.Default).pipe(
  Layer.provideMerge(CommandRunner.Default),
  Layer.provideMerge(NodeContext.layer),
);

// Debug logs go to stderr so they never interleave with prompt rendering on stdout.
const DebugLoggerLive = Logger.replace(Logger.defaultLogger, Logger.prettyLogger({ stderr: true }));

const MainLive = debug ? Layer.merge(ServicesLive, DebugLoggerLive) : ServicesLive;

const program = run(argv, process.cwd(), {
  userAgent: process.env['npm_config_user_agent'],
  templatesRoot,
  debug,
}).pipe(
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
