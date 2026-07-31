import type { CommandHandler } from '@chanom/internal/testing';
import type { SystemErrorReason } from '@effect/platform/Error';

import { Git } from '@chanom/internal';
import { makeTestFs, makeTestPrompter, makeTestRunner } from '@chanom/internal/testing';
import { Layer } from 'effect';

import { TEMPLATE_FILES } from '../../src/templates.ts';

/** Where the in-memory template fixtures live; passed to `run`/`scaffold` as templatesRoot. */
export const TEMPLATE_ROOT = '/templates';

/**
 * Seeds the in-memory FS with every static template under {@link TEMPLATE_ROOT},
 * each carrying a marker so copy assertions can check the byte landed verbatim.
 */
const templateFixtures = (): Record<string, string> =>
  Object.fromEntries(
    TEMPLATE_FILES.map((file) => [`${TEMPLATE_ROOT}/${file.src}`, `TEMPLATE:${file.src}\n`]),
  );

export interface EnvOptions {
  readonly files?: Record<string, string>;
  readonly dirs?: readonly string[];
  readonly readErrors?: Record<string, SystemErrorReason>;
  readonly answers?: Record<string, unknown>;
  readonly commands?: CommandHandler;
}

/** Full scaffolder environment with FS, prompter, command runner, and Git in memory. */
export const makeEnv = (options: EnvOptions = {}) => {
  const fs = makeTestFs(
    { ...templateFixtures(), ...options.files },
    options.dirs,
    options.readErrors,
  );
  const prompter = makeTestPrompter(options.answers);
  const runner = makeTestRunner(options.commands);

  const base = Layer.mergeAll(fs.layer, prompter.layer, runner.layer);
  const layer = Git.Default.pipe(Layer.provideMerge(base));

  return { fs, prompter, runner, layer };
};
