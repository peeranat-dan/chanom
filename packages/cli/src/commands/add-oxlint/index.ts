import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import type { Pkg } from '../../domain/pkg.ts';

import { Prompter } from '../../services/prompter.ts';
import { detectSetupFile } from '../../utils/detect-setup.ts';
import { configFile, getScriptPlan } from './logic.ts';

export { getPackages } from './logic.ts';

/** Returns a copy of `pkg` with missing scripts added; the caller owns writing package.json. */
export const apply = (cwd: string, esm: boolean, pkg: Pkg) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const prompter = yield* Prompter;

    const existing = yield* detectSetupFile('oxlint', cwd);

    if (Option.isSome(existing)) {
      yield* prompter.warn(
        `\`${path.basename(existing.value)}\` already exists - skipping oxlint config`,
      );
    } else {
      const config = configFile(esm);
      yield* fs.writeFileString(path.join(cwd, config.fileName), config.contents);
    }

    const plan = getScriptPlan(pkg.scripts);
    for (const key of plan.skipped) {
      yield* prompter.warn(`\`${key}\` script already exists in package.json - skipping`);
    }

    return { ...pkg, scripts: plan.scripts };
  });
