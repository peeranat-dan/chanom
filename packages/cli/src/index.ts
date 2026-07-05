#!/usr/bin/env node
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { run } from './cli.ts';
import { CommandRunner } from './services/command-runner.ts';
import { Git } from './services/git.ts';
import { PackageInstaller } from './services/package-installer.ts';
import { Prompter } from './services/prompter.ts';

const MainLive = Layer.mergeAll(Prompter.Default, Git.Default, PackageInstaller.Default).pipe(
  Layer.provideMerge(CommandRunner.Default),
  Layer.provideMerge(NodeContext.layer),
);

const program = run(process.argv[2]).pipe(
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
