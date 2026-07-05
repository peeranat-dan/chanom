import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import { SETUP_FILE_CANDIDATES, type SetupFile } from '../domain/setup.ts';

/** Finds an existing config file for the given tool, if any. */
export const detectSetupFile = (type: SetupFile, cwd: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    for (const candidate of SETUP_FILE_CANDIDATES[type]) {
      const filepath = path.join(cwd, candidate);
      if (yield* fs.exists(filepath)) {
        return Option.some(filepath);
      }
    }

    return Option.none<string>();
  });
