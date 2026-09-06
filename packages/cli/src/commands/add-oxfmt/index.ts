import { Prompter } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import type { Pkg } from '../../domain/pkg.ts';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { configFile, getScriptPlan } from './logic.ts';

export { getPackages } from './logic.ts';

/** Returns a copy of `pkg` with missing scripts added; the caller owns writing package.json. */
export const apply = Effect.fn('add-oxfmt.apply')(function* (cwd: string, esm: boolean, pkg: Pkg) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const existing = yield* detectSetupFile('oxfmt', cwd);

  // Scripts have to name whichever config ends up on disk, so an existing one
  // that we skip still decides how oxfmt gets invoked.
  let configFileName: string;

  if (Option.isSome(existing)) {
    configFileName = path.basename(existing.value);
    yield* prompter.warn(`\`${configFileName}\` already exists - skipping oxfmt config`);
  } else {
    const config = configFile(esm);
    configFileName = config.fileName;
    yield* fs.writeFileString(path.join(cwd, config.fileName), config.contents);
  }

  const plan = getScriptPlan(pkg.scripts, configFileName);
  for (const key of plan.skipped) {
    yield* prompter.warn(`\`${key}\` script already exists in package.json - skipping`);
  }

  return { ...pkg, scripts: plan.scripts };
});
