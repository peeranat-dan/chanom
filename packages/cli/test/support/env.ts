import type { SystemErrorReason } from '@effect/platform/Error';

import { Layer } from 'effect';

import { Git } from '../../src/services/git.ts';
import { PackageInstaller } from '../../src/services/package-installer.ts';
import { type CommandHandler, makeTestRunner } from './command-runner.ts';
import { makeTestFs } from './fs.ts';
import { makeTestPrompter } from './prompter.ts';

export interface TestEnvOptions {
  readonly files?: Record<string, string>;
  readonly dirs?: readonly string[];
  readonly readErrors?: Record<string, SystemErrorReason>;
  readonly answers?: Record<string, unknown>;
  readonly commands?: CommandHandler;
}

/** Full CLI environment with every service backed by an in-memory test double. */
export const makeTestEnv = (options: TestEnvOptions = {}) => {
  const fs = makeTestFs(options.files, options.dirs, options.readErrors);
  const prompter = makeTestPrompter(options.answers);
  const runner = makeTestRunner(options.commands);

  const base = Layer.mergeAll(fs.layer, prompter.layer, runner.layer);
  const layer = Layer.mergeAll(Git.Default, PackageInstaller.Default).pipe(
    Layer.provideMerge(base),
  );

  return { fs, prompter, runner, layer };
};
