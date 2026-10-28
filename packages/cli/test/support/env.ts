import type { CommandHandler } from '@chanom/internal/testing';
import type { PlatformError } from 'effect';

import { Git } from '@chanom/internal';
import { makeTestFs, makeTestPrompter, makeTestRunner } from '@chanom/internal/testing';
import { Layer } from 'effect';

import { PackageInstaller } from '../../src/services/package-installer.ts';

export interface TestEnvOptions {
  readonly files?: Record<string, string>;
  readonly dirs?: readonly string[];
  readonly readErrors?: Record<string, PlatformError.SystemErrorTag>;
  readonly answers?: Record<string, unknown>;
  readonly commands?: CommandHandler;
}

/** Full CLI environment with every service backed by an in-memory test double. */
export const makeTestEnv = (options: TestEnvOptions = {}) => {
  const fs = makeTestFs(options.files, options.dirs, options.readErrors);
  const prompter = makeTestPrompter(options.answers);
  const runner = makeTestRunner(options.commands);

  const base = Layer.mergeAll(fs.layer, prompter.layer, runner.layer);
  const layer = Layer.mergeAll(Git.layer, PackageInstaller.layer).pipe(Layer.provideMerge(base));

  return { fs, prompter, runner, layer };
};
